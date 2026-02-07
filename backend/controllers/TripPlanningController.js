require("dotenv").config();
const jwt = require("jsonwebtoken");
const { GoogleGenAI } = require("@google/genai");
const TravelPreference = require("../models/TravelPreferences");
const History = require("../models/History");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL_TRIP_PLAN ||
  process.env.GEMINI_MODEL_STREAM ||
  "gemini-2.0-flash";

const genAI = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const asText = (value, fallback = "Not provided") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const safeJoin = (value) => {
  const list = normalizeList(value);
  return list.length ? list.join(", ") : "Not provided";
};

const extractGeneratedText = (response) => {
  if (typeof response?.text === "string") return response.text.trim();
  if (typeof response?.text === "function") {
    const maybe = response.text();
    if (typeof maybe === "string") return maybe.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const combined = parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join("\n")
    .trim();
  return combined;
};

const getAuthUserId = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    const err = new Error("No token provided");
    err.statusCode = 401;
    throw err;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded?.id) {
    const err = new Error("Invalid token");
    err.statusCode = 401;
    throw err;
  }

  return decoded.id;
};

const buildTripPlanPrompt = (preferences) => {
  const questionnaire = preferences?.questionnaire || {};
  const context = questionnaire.context || {};
  const destination = questionnaire.destination || {};
  const dates = questionnaire.dates || {};
  const budget = questionnaire.budget || {};
  const askedQuestions = Array.isArray(questionnaire.askedQuestions)
    ? questionnaire.askedQuestions
    : [];

  const answeredQA = askedQuestions
    .filter((item) => item?.question)
    .slice(0, 50)
    .map(
      (item) =>
        `- ${item.question}: ${asText(
          Array.isArray(item.answer) ? safeJoin(item.answer) : item.answer
        )}`
    )
    .join("\n");

  return `
You are a senior travel planner AI.
Create a highly practical trip plan based on the user's completed onboarding form.

Hard rules:
- Respect the user answers as constraints.
- Do not invent unavailable facts.
- If key information is missing, state "Unknown" and ask follow-up questions.
- Output in Markdown only.
- Never ask follow up questions.


User Saved Preferences:
- Travel style: ${asText(preferences?.travelStyle, "solo")}
- Budget level: ${asText(preferences?.budgetLevel, "mid-range")}
- Interests: ${safeJoin(preferences?.interests)}
- Mobility preference: ${asText(preferences?.mobilityPreference, "walking")}
- Food preferences: ${safeJoin(preferences?.foodPreferences)}

Onboarding Form Answers:
- Trip status: ${asText(questionnaire.tripStatus)}
- Home country: ${asText(context.homeCountry)}
- Departure city: ${asText(context.departureCity)}
- Currency: ${asText(context.currency, "USD")}
- Destination countries: ${safeJoin(destination.countries)}
- Destination cities: ${safeJoin(destination.cities)}
- Destination regions: ${safeJoin(destination.regions)}
- Destination flexibility: ${asText(destination.flexibility)}
- Start date: ${asText(dates.start)}
- End date: ${asText(dates.end)}
- Duration days: ${asText(dates.durationDays)}
- Timing priorities: ${safeJoin(dates.timingPriority)}
- Season preference: ${asText(dates.seasonPref)}
- Budget (USD): ${asText(budget.usdBudget)}
- Budget display currency: ${asText(budget.currency, "USD")}
- Budget priority: ${asText(budget.priority)}
- Spending style: ${asText(budget.spendingStyle)}

Question & Answer Log:
${answeredQA || "- No detailed question log available."}

Return format:
1) ## Trip Strategy
2) ## Day-by-Day Itinerary Outline
3) ## Budget Allocation
4) ## Food and Mobility Plan
5) ## Booking and Logistics Checklist
6) ## Risks and Alternatives
`.trim();
};

exports.generateTripPlan = async (req, res) => {
  try {
    if (!GEMINI_KEY || !genAI) {
      return res.status(500).json({ message: "Gemini key missing" });
    }

    const userId = getAuthUserId(req);

    const storedPreferences = await TravelPreference.findOne({
      userId,
    }).lean();

    if (!storedPreferences) {
      return res.status(404).json({
        message: "No travel preferences found. Save preferences first.",
      });
    }

    const prompt = buildTripPlanPrompt(storedPreferences);

    const aiResponse = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const planText = extractGeneratedText(aiResponse);
    if (!planText) {
      return res
        .status(502)
        .json({ message: "Trip planning model returned empty output" });
    }

    try {
      await History.create({
        userId: [userId],
        title: "Trip Plan Draft",
        detail: planText,
      });
    } catch (historyError) {
      console.warn("Trip plan history save failed:", historyError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Trip plan generated",
      data: {
        plan: planText,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("generateTripPlan error:", error.message);
    return res.status(500).json({
      message: "Trip plan generation failed",
      error: error.message,
    });
  }
};

exports.getLatestTripPlan = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const latestPlan = await History.findOne({
      userId,
      title: "Trip Plan Draft",
    })
      .sort({ _id: -1 })
      .lean();

    if (!latestPlan?.detail) {
      return res.status(404).json({
        message: "No trip plan found for this user",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        plan: latestPlan.detail,
        createdAt: latestPlan.createdAt || null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("getLatestTripPlan error:", error.message);
    return res.status(500).json({
      message: "Failed to load latest trip plan",
      error: error.message,
    });
  }
};
