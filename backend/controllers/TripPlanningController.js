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
const LIVE_HISTORY_TITLES = ["Live Travel Assistant", "Generated Content"];

const genAI = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const toYesNo = (value) => (value ? "Yes" : "No");

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const formatAnswerValue = (value, fallback = "Not provided") => {
  if (Array.isArray(value)) {
    const list = normalizeList(value);
    return list.length ? list.join(", ") : fallback;
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return fallback;

  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => hasValue(item));
    if (!entries.length) return fallback;
    return entries
      .map(([key, item]) => `${key}: ${formatAnswerValue(item, "Not set")}`)
      .join(" | ");
  }

  const text = String(value).trim();
  return text || fallback;
};

const buildQuestionnaireSummary = (questionnaire = {}) => {
  const context = questionnaire.context || {};
  const destination = questionnaire.destination || {};
  const dates = questionnaire.dates || {};
  const budget = questionnaire.budget || {};
  const food = questionnaire.food || {};
  const mobility = questionnaire.mobility || {};
  const style = questionnaire.style || {};
  const group = questionnaire.group || {};
  const accommodation = questionnaire.accommodation || {};
  const goals = questionnaire.goals || {};
  const permissions = questionnaire.permissions || {};

  const lines = [
    "- Trip Status",
    `  - Trip status: ${formatAnswerValue(questionnaire.tripStatus)}`,
    "",
    "- Home Context",
    `  - Home country: ${formatAnswerValue(context.homeCountry)}`,
    `  - Departure city: ${formatAnswerValue(context.departureCity)}`,
    `  - Currency: ${formatAnswerValue(context.currency, "USD")}`,
    `  - Use nearby airports: ${toYesNo(Boolean(context.nearbyAirports))}`,
    `  - Departure airport code: ${formatAnswerValue(
      context.departureAirportCode
    )}`,
    "",
    "- Destination",
    `  - Countries: ${formatAnswerValue(destination.countries)}`,
    `  - Cities: ${formatAnswerValue(destination.cities)}`,
    `  - Regions: ${formatAnswerValue(destination.regions)}`,
    `  - Continents: ${formatAnswerValue(destination.continents)}`,
    `  - Flexibility: ${formatAnswerValue(destination.flexibility)}`,
    `  - Day trips planned: ${toYesNo(Boolean(destination.dayTripsPlanned))}`,
    "",
    "- Timing",
    `  - Start date: ${formatAnswerValue(dates.start)}`,
    `  - End date: ${formatAnswerValue(dates.end)}`,
    `  - Earliest start: ${formatAnswerValue(dates.earliestStart)}`,
    `  - Latest start: ${formatAnswerValue(dates.latestStart)}`,
    `  - Duration days: ${formatAnswerValue(dates.durationDays, "7")}`,
    `  - Duration range: ${formatAnswerValue(dates.durationRange)}`,
    `  - Can change dates: ${formatAnswerValue(dates.canChangeDates, "No")}`,
    `  - Timing priorities: ${formatAnswerValue(dates.timingPriority)}`,
    `  - Season preference: ${formatAnswerValue(dates.seasonPref)}`,
    "",
    "- Budget",
    `  - Budget amount (USD): ${formatAnswerValue(budget.usdBudget)}`,
    `  - Budget display currency: ${formatAnswerValue(budget.currency, "USD")}`,
    `  - Budget type: ${formatAnswerValue(budget.budgetType)}`,
    `  - Budget priority: ${formatAnswerValue(budget.priority)}`,
    `  - Spending style: ${formatAnswerValue(budget.spendingStyle)}`,
    `  - Saved amount (USD): ${formatAnswerValue(budget.savedAmountUsd)}`,
    `  - Budget flexibility: ${toYesNo(Boolean(budget.isFlexible))}`,
    `  - Emergency buffer (USD): ${formatAnswerValue(budget.emergencyBufferUsd)}`,
    "",
    "- Food",
    `  - Food priority: ${formatAnswerValue(food.importance)}`,
    `  - Diet/preferences: ${formatAnswerValue(food.diet)}`,
    `  - Food notes: ${formatAnswerValue(food.notes)}`,
    "",
    "- Mobility",
    `  - Preferred transport: ${formatAnswerValue(mobility.preferredTransport)}`,
    `  - Comfort range: ${formatAnswerValue(mobility.comfortRange)}`,
    `  - Mobility notes: ${formatAnswerValue(mobility.notes)}`,
    "",
    "- Travel Style",
    `  - Interests: ${formatAnswerValue(style.interests)}`,
    `  - Pace: ${formatAnswerValue(style.travelPace)}`,
    `  - Avoid: ${formatAnswerValue(style.hates)}`,
    `  - Taste text: ${formatAnswerValue(style.tasteText)}`,
    `  - Past loved: ${formatAnswerValue(style.pastLoved)}`,
    "",
    "- Group (if booked)",
    `  - Group type: ${formatAnswerValue(group.who)}`,
    `  - Total people: ${formatAnswerValue(group.totalPeople)}`,
    `  - Adults: ${formatAnswerValue(group.adults)}`,
    `  - Children ages: ${formatAnswerValue(group.childrenAges)}`,
    "",
    "- Accommodation (if booked)",
    `  - Booking status: ${formatAnswerValue(accommodation.status)}`,
    `  - Type: ${formatAnswerValue(accommodation.type)}`,
    `  - Preferences: ${formatAnswerValue(accommodation.preference)}`,
    "",
    "- Goals (if booked)",
    `  - Experience goals: ${formatAnswerValue(goals.experienceGoals)}`,
    `  - One sentence goal: ${formatAnswerValue(goals.oneSentenceGoal)}`,
    "",
    "- AI Permissions",
    `  - Allow alternative destinations: ${toYesNo(
      Boolean(permissions.allowAltDestinations)
    )}`,
    `  - Allow budget optimization: ${toYesNo(
      Boolean(permissions.allowBudgetOptimize)
    )}`,
    `  - Allow daily adjustments: ${toYesNo(
      Boolean(permissions.allowDailyAdjust)
    )}`,
    `  - Allow save for future: ${toYesNo(
      Boolean(permissions.allowSaveForFuture)
    )}`,
  ];

  return lines.join("\n");
};

const buildAnsweredQALog = (questionnaire = {}) => {
  const askedQuestions = Array.isArray(questionnaire.askedQuestions)
    ? questionnaire.askedQuestions
    : [];

  const lines = askedQuestions
    .filter((item) => item?.question)
    .slice(0, 120)
    .map(
      (item) => `- ${item.question}: ${formatAnswerValue(item.answer, "Not answered")}`
    );

  return lines.length ? lines.join("\n") : "- No detailed question log available.";
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
  const questionnaireSummary = buildQuestionnaireSummary(questionnaire);
  const answeredQA = buildAnsweredQALog(questionnaire);

  return `
You are a senior travel planner AI.
Create a highly practical trip plan based on the user's completed onboarding form.

Hard rules:
- Respect the user answers as constraints.
- Do not invent unavailable facts.
- If key information is missing, state "Unknown".
- Output in Markdown only.
- Never ask follow up questions.
- Use all available form answers. Do not ignore any answered section.


User Saved Preferences:
- Travel style: ${formatAnswerValue(preferences?.travelStyle, "solo")}
- Budget level: ${formatAnswerValue(preferences?.budgetLevel, "mid-range")}
- Interests: ${formatAnswerValue(preferences?.interests)}
- Mobility preference: ${formatAnswerValue(
    preferences?.mobilityPreference,
    "walking"
  )}
- Food preferences: ${formatAnswerValue(preferences?.foodPreferences)}

Onboarding Form Answers (complete):
${questionnaireSummary}

Question & Answer Log:
${answeredQA || "- No detailed question log available."}

Return format:
1) ## Trip Strategy
Include how the user's preferences and constraints shaped this strategy.
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

exports.getTripDashboardData = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const [latestPlan, latestLiveResponse] = await Promise.all([
      History.findOne({
        userId,
        title: "Trip Plan Draft",
      })
        .sort({ _id: -1 })
        .lean(),
      History.findOne({
        userId,
        title: { $in: LIVE_HISTORY_TITLES },
      })
        .sort({ _id: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        tripPlan: latestPlan?.detail
          ? {
              id: latestPlan._id,
              title: latestPlan.title || "Trip Plan Draft",
              response: latestPlan.detail,
              createdAt: latestPlan.createdAt || null,
            }
          : null,
        liveTravel: latestLiveResponse?.detail
          ? {
              id: latestLiveResponse._id,
              title: latestLiveResponse.title || "Live Travel Assistant",
              response: latestLiveResponse.detail,
              createdAt: latestLiveResponse.createdAt || null,
            }
          : null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("getTripDashboardData error:", error.message);
    return res.status(500).json({
      message: "Failed to load trip dashboard data",
      error: error.message,
    });
  }
};
