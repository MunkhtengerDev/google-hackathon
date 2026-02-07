require("dotenv").config();
const sharp = require("sharp");
const mongoose = require("mongoose");
const History = require("../models/History");
const { GoogleGenAI } = require("@google/genai");
const TravelPreference = require("../models/TravelPreferences");

// ---- Gemini ----
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) console.warn("Warning: GEMINI_API_KEY not set");
const GEMINI_MODEL =
  process.env.GEMINI_MODEL_STREAM || "gemini-3-flash-preview";
const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });

// ---- Image constraints ----
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const TARGET_WIDTH = 800;
const LARGE_THRESHOLD = 1.5 * 1024 * 1024;

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
};

const formatAnswerValue = (value) => {
  if (Array.isArray(value)) {
    const cleaned = normalizeList(value);
    return cleaned.length ? cleaned.join(", ") : "Not provided";
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => hasValue(v));
    if (!entries.length) return "Not provided";
    return entries
      .map(([key, val]) => `${key}: ${formatAnswerValue(val)}`)
      .join(" | ");
  }

  if (value === undefined || value === null) return "Not provided";
  const txt = String(value).trim();
  return txt || "Not provided";
};

const buildQuestionnaireContext = (
  questionnaire,
  { includeDestination = true } = {}
) => {
  if (!questionnaire || typeof questionnaire !== "object") {
    return "- Form answers: Not provided.";
  }

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

  const countries = normalizeList(destination.countries);
  const cities = normalizeList(destination.cities);
  const regions = normalizeList(destination.regions);
  const continents = normalizeList(destination.continents);
  const timingPriority = normalizeList(dates.timingPriority);

  const block = [
    "Form Answers (from onboarding):",
    `- Trip status: ${formatAnswerValue(questionnaire.tripStatus)}`,
    `- Home country: ${formatAnswerValue(context.homeCountry)}`,
    `- Departure city: ${formatAnswerValue(context.departureCity)}`,
    `- Currency: ${formatAnswerValue(context.currency)}`,
    `- Nearby airports allowed: ${formatAnswerValue(context.nearbyAirports)}`,
    `- Departure airport code: ${formatAnswerValue(
      context.departureAirportCode
    )}`,
    `- Date start: ${formatAnswerValue(dates.start)}`,
    `- Date end: ${formatAnswerValue(dates.end)}`,
    `- Earliest start: ${formatAnswerValue(dates.earliestStart)}`,
    `- Latest start: ${formatAnswerValue(dates.latestStart)}`,
    `- Duration days: ${formatAnswerValue(dates.durationDays)}`,
    `- Duration range: ${formatAnswerValue(dates.durationRange)}`,
    `- Can change dates: ${formatAnswerValue(dates.canChangeDates)}`,
    `- Timing priorities: ${formatAnswerValue(timingPriority)}`,
    `- Season preference: ${formatAnswerValue(dates.seasonPref)}`,
    `- Budget amount (USD): ${formatAnswerValue(budget.usdBudget)}`,
    `- Budget display currency: ${formatAnswerValue(budget.currency)}`,
    `- Budget type: ${formatAnswerValue(budget.budgetType)}`,
    `- Budget priority: ${formatAnswerValue(budget.priority)}`,
    `- Spending style: ${formatAnswerValue(budget.spendingStyle)}`,
    `- Saved amount (USD): ${formatAnswerValue(budget.savedAmountUsd)}`,
    `- Budget flexibility: ${formatAnswerValue(budget.isFlexible)}`,
    `- Emergency buffer (USD): ${formatAnswerValue(budget.emergencyBufferUsd)}`,
    `- Food priority: ${formatAnswerValue(food.importance)}`,
    `- Food preferences/restrictions: ${formatAnswerValue(food.diet)}`,
    `- Food notes: ${formatAnswerValue(food.notes)}`,
    `- Preferred transport: ${formatAnswerValue(mobility.preferredTransport)}`,
    `- Comfort range: ${formatAnswerValue(mobility.comfortRange)}`,
    `- Mobility notes: ${formatAnswerValue(mobility.notes)}`,
    `- Travel interests: ${formatAnswerValue(style.interests)}`,
    `- Travel pace: ${formatAnswerValue(style.travelPace)}`,
    `- Things to avoid: ${formatAnswerValue(style.hates)}`,
    `- Taste text: ${formatAnswerValue(style.tasteText)}`,
    `- Past loved places/experiences: ${formatAnswerValue(style.pastLoved)}`,
    `- Group type: ${formatAnswerValue(group.who)}`,
    `- Total people: ${formatAnswerValue(group.totalPeople)}`,
    `- Adults: ${formatAnswerValue(group.adults)}`,
    `- Children ages: ${formatAnswerValue(group.childrenAges)}`,
    `- Accommodation status: ${formatAnswerValue(accommodation.status)}`,
    `- Accommodation type: ${formatAnswerValue(accommodation.type)}`,
    `- Accommodation preferences: ${formatAnswerValue(accommodation.preference)}`,
    `- Experience goals: ${formatAnswerValue(goals.experienceGoals)}`,
    `- One sentence goal: ${formatAnswerValue(goals.oneSentenceGoal)}`,
    `- Allow alternative destinations: ${formatAnswerValue(
      permissions.allowAltDestinations
    )}`,
    `- Allow budget optimization: ${formatAnswerValue(
      permissions.allowBudgetOptimize
    )}`,
    `- Allow daily adjustment: ${formatAnswerValue(permissions.allowDailyAdjust)}`,
    `- Allow save for future: ${formatAnswerValue(
      permissions.allowSaveForFuture
    )}`,
  ];

  if (includeDestination) {
    block.splice(
      5,
      0,
      `- Destination countries: ${formatAnswerValue(countries)}`,
      `- Destination cities: ${formatAnswerValue(cities)}`,
      `- Destination regions: ${formatAnswerValue(regions)}`,
      `- Destination continents: ${formatAnswerValue(continents)}`,
      `- Destination flexibility: ${formatAnswerValue(destination.flexibility)}`,
      `- Day trips planned: ${formatAnswerValue(destination.dayTripsPlanned)}`
    );
  }

  const askedQuestions = Array.isArray(questionnaire.askedQuestions)
    ? questionnaire.askedQuestions
    : [];

  const qaLines = askedQuestions
    .filter((item) => item && item.question)
    .filter(
      (item) =>
        includeDestination || !String(item.key || "").startsWith("destination.")
    )
    .filter((item) => hasValue(item.answer))
    .slice(0, 120)
    .map((item) => `- ${item.question}: ${formatAnswerValue(item.answer)}`);

  if (qaLines.length) {
    block.push("Answered Questions:");
    block.push(...qaLines);
  }

  return block.join("\n");
};

// Utility SSE send
const sseSend = (res, obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
const sseError = (res, message, status = 500) => {
  sseSend(res, { type: "error", message, status });
  res.end();
};

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
};

exports.fetchImageDataAndGenerateContentStream = async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  try {
    const {
      imageBase64: rawBase64,
      locationLatitude,
      locationLongitude,
      address,
      userPrompt,
      userId, // Incoming ID (can be MongoDB ObjectId OR Guest UUID)
      language,
    } = req.body || {};

    const sanitizedPrompt =
      typeof userPrompt === "string" ? userPrompt.trim() : "";
    const hasImageInput = Boolean(rawBase64);
    const hasLocationInput =
      hasValue(address) ||
      hasValue(locationLatitude) ||
      hasValue(locationLongitude);
    const hasPromptInput = Boolean(sanitizedPrompt);

    if (!hasImageInput && !hasLocationInput && !hasPromptInput) {
      return sseError(
        res,
        "Provide at least one input: image, shared location, or prompt.",
        400
      );
    }

    if (!userId) return sseError(res, "User ID required", 400);
    if (!GEMINI_KEY) return sseError(res, "Gemini key missing", 500);

    // ✅ FIX: Check if userId is ObjectId or UUID
    const isMongoId = isValidObjectId(userId);

    // ✅ FIX: Build query based on ID type
    let query;
    if (isMongoId) {
      // If it's a valid MongoDB ObjectId, query by userId field
      query = { userId: userId };
    } else {
      // If it's a UUID (guest), query by guestId field
      query = { guestId: userId };
    }

    // ✅ FIX: Fetch preferences using the same logic
    let userPrefs = null;
    try {
      userPrefs = await TravelPreference.findOne(query);
    } catch (e) {
      console.warn("Could not fetch preferences:", e.message);
    }

    let buffer = null;
    if (hasImageInput) {
      // Normalize base64
      let imageBase64 = rawBase64;
      if (imageBase64.startsWith("data:")) {
        const comma = imageBase64.indexOf(",");
        if (comma !== -1) imageBase64 = imageBase64.slice(comma + 1);
      }

      // Decode + compress using Sharp
      buffer = Buffer.from(imageBase64, "base64");
      try {
        buffer =
          buffer.length > LARGE_THRESHOLD
            ? await sharp(buffer)
                .rotate()
                .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
                .jpeg({ quality: 60, mozjpeg: true })
                .toBuffer()
            : await sharp(buffer)
                .rotate()
                .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
                .jpeg({ quality: 70, mozjpeg: true })
                .toBuffer();
      } catch (error) {
        return sseError(res, "Invalid image format or unreadable image", 400);
      }

      if (buffer.length > MAX_IMAGE_BYTES) {
        return sseError(res, "Image too large after compression", 400);
      }
      sseSend(res, { type: "image", compressedBytes: buffer.length });
    }

    const imageUrl = null;

    // Build location context
    const hasLat = hasValue(locationLatitude);
    const hasLng = hasValue(locationLongitude);
    const locationParts = [];
    if (hasValue(address)) locationParts.push(`Address: ${address}`);
    if (hasLat && hasLng) {
      locationParts.push(
        `Coordinates: ${locationLatitude},${locationLongitude}`
      );
    }
    const locLine = locationParts.join(" | ");
    const userPromptLine = sanitizedPrompt
      ? `Live user request:\n${sanitizedPrompt}`
      : "";

    const hasLiveAnchor = hasLocationInput || hasImageInput;
    const shouldUsePlannedDestination = !hasLiveAnchor;

    // Build personalized preference context for the Prompt.
    // For live requests with location/image, onboarding destination details must not override live context.
    const questionnaireContext = buildQuestionnaireContext(
      userPrefs?.questionnaire,
      {
        includeDestination: shouldUsePlannedDestination,
      }
    );

    const prefContext = userPrefs
      ? `
User Preference Signals (soft constraints):
- Travel style: ${userPrefs.travelStyle || "not specified"}
- Budget: ${userPrefs.budgetLevel || "mid-range"}
- Interests: ${
          userPrefs.interests?.length
            ? userPrefs.interests.join(", ")
            : "general"
        }
- Mobility: ${userPrefs.mobilityPreference || "walking"}
- Food: ${
          userPrefs.foodPreferences?.length
            ? userPrefs.foodPreferences.join(", ")
            : "no restrictions"
        }`
      : "";

    const planningContextBlock = userPrefs?.questionnaire
      ? `\nSaved Planning Context:\n${questionnaireContext}`
      : "";

    const budgetPriority = userPrefs?.questionnaire?.budget?.priority;
    const spendingStyle = userPrefs?.questionnaire?.budget?.spendingStyle;
    const tripStatus = userPrefs?.questionnaire?.tripStatus;
    const desiredCountries = normalizeList(
      userPrefs?.questionnaire?.destination?.countries
    );
    const desiredCities = normalizeList(
      userPrefs?.questionnaire?.destination?.cities
    );
    const desiredRegions = normalizeList(
      userPrefs?.questionnaire?.destination?.regions
    );
    const timingPriorities = normalizeList(
      userPrefs?.questionnaire?.dates?.timingPriority
    );
    const preferredTransport = normalizeList(
      userPrefs?.questionnaire?.mobility?.preferredTransport
    );
    const comfortRange = userPrefs?.questionnaire?.mobility?.comfortRange;
    const mobilityNotes = userPrefs?.questionnaire?.mobility?.notes;
    const travelPace = userPrefs?.questionnaire?.style?.travelPace;
    const avoidList = normalizeList(userPrefs?.questionnaire?.style?.hates);
    const tasteText = userPrefs?.questionnaire?.style?.tasteText;
    const experienceGoals = normalizeList(
      userPrefs?.questionnaire?.goals?.experienceGoals
    );
    const oneSentenceGoal = userPrefs?.questionnaire?.goals?.oneSentenceGoal;
    const allowDailyAdjust =
      userPrefs?.questionnaire?.permissions?.allowDailyAdjust;
    const allowAltDestinations =
      userPrefs?.questionnaire?.permissions?.allowAltDestinations;

    let budgetInstructions = "";
    if (userPrefs?.budgetLevel === "budget" || budgetPriority === "cheapest") {
      budgetInstructions =
        "- Focus on hostels, budget hotels, affordable stays, and budget-friendly options.";
    } else if (
      userPrefs?.budgetLevel === "luxury" ||
      budgetPriority === "comfort" ||
      budgetPriority === "once"
    ) {
      budgetInstructions =
        "- Focus on high-end hotels, boutique stays, luxury resorts, and premium options.";
    }
    if (spendingStyle === "track") {
      budgetInstructions +=
        "\n- Include price transparency and clearly cost-conscious options in each section.";
    }

    // Build food-specific instructions
    let foodInstructions = "";
    if (userPrefs?.foodPreferences?.length) {
      const foodPrefs = userPrefs.foodPreferences;
      if (foodPrefs.includes("vegetarian")) {
        foodInstructions +=
          "- Prioritize vegetarian-friendly restaurant options.\n";
      }
      if (foodPrefs.includes("vegan")) {
        foodInstructions += "- Prioritize vegan-friendly restaurant options.\n";
      }
      if (foodPrefs.includes("halal")) {
        foodInstructions += "- Prioritize halal restaurant options.\n";
      }
      if (foodPrefs.includes("kosher")) {
        foodInstructions += "- Prioritize kosher restaurant options.\n";
      }
      if (foodPrefs.includes("local")) {
        foodInstructions +=
          "- Prioritize authentic local cuisine restaurants.\n";
      }
    }

    // Build mobility-specific instructions
    let mobilityInstructions = "";
    if (userPrefs?.mobilityPreference === "limited") {
      mobilityInstructions =
        "- Prioritize wheelchair-accessible and easy-access locations.";
    } else if (userPrefs?.mobilityPreference === "transport") {
      mobilityInstructions =
        "- Prioritize locations accessible by public transport or taxi.";
    }
    if (preferredTransport.length) {
      mobilityInstructions += `\n- Prefer these movement modes: ${preferredTransport.join(
        ", "
      )}.`;
    }
    if (comfortRange) {
      mobilityInstructions += `\n- Keep movement intensity around this comfort range: ${comfortRange}.`;
    }
    if (hasValue(mobilityNotes)) {
      mobilityInstructions += `\n- Respect mobility notes: ${mobilityNotes}.`;
    }

    // Build interest-specific instructions
    let interestInstructions = "";
    if (userPrefs?.interests?.length) {
      interestInstructions = `- Prioritize attractions related to: ${userPrefs.interests.join(
        ", "
      )}.`;
    }

    let styleInstructions = "";
    if (travelPace) {
      styleInstructions += `- Match recommendations to this pace: ${travelPace}.\n`;
    }
    if (avoidList.length) {
      styleInstructions += `- Avoid these user dislikes when possible: ${avoidList.join(
        ", "
      )}.\n`;
    }
    if (hasValue(tasteText)) {
      styleInstructions += `- Follow this travel taste note: ${tasteText}.\n`;
    }
    if (experienceGoals.length) {
      styleInstructions += `- Keep these trip goals in mind: ${experienceGoals.join(
        ", "
      )}.\n`;
    }
    if (hasValue(oneSentenceGoal)) {
      styleInstructions += `- Emotional trip goal: ${oneSentenceGoal}.\n`;
    }
    if (allowDailyAdjust === false) {
      styleInstructions +=
        "- Keep recommendations stable and avoid suggesting frequent plan changes.\n";
    }
    if (allowAltDestinations === false) {
      styleInstructions +=
        "- Do not suggest alternate cities or destinations unless explicitly asked.\n";
    }

    const destinationInstructions = [];
    if (shouldUsePlannedDestination && desiredCountries.length) {
      destinationInstructions.push(
        `- Keep recommendations aligned with these countries: ${desiredCountries.join(
          ", "
        )}.`
      );
    }
    if (shouldUsePlannedDestination && desiredCities.length) {
      destinationInstructions.push(
        `- Strongly prioritize these cities: ${desiredCities.join(", ")}.`
      );
    }
    if (shouldUsePlannedDestination && desiredRegions.length) {
      destinationInstructions.push(
        `- Consider these regions/areas: ${desiredRegions.join(", ")}.`
      );
    }

    const timingInstructions = [];
    if (shouldUsePlannedDestination && timingPriorities.includes("weather")) {
      timingInstructions.push("- Prioritize favorable weather windows.");
    }
    if (shouldUsePlannedDestination && timingPriorities.includes("crowds")) {
      timingInstructions.push(
        "- Favor lower-crowd attractions and time slots."
      );
    }
    if (shouldUsePlannedDestination && timingPriorities.includes("price")) {
      timingInstructions.push(
        "- Prefer value-for-money choices and lower-cost options."
      );
    }
    if (shouldUsePlannedDestination && tripStatus === "booked") {
      timingInstructions.push(
        "- Assume dates are mostly fixed and optimize around confirmed-trip realism."
      );
    } else if (shouldUsePlannedDestination && tripStatus === "planning") {
      timingInstructions.push(
        "- Include alternatives that improve value and timing because trip is still in planning phase."
      );
    }

    const livePriorityRules = hasLiveAnchor
      ? `
Context Priority (MANDATORY):
- Highest priority is the current request's live context (location/image + user prompt).
- If location is provided, recommendations must stay around that location.
- If location conflicts with saved trip destination, use the provided live location.
- Do not switch to another city/country unless the user explicitly asks for it.
- Saved onboarding destination is only secondary personalization in this mode.`
      : `
Context Priority (MANDATORY):
- No strong live anchor detected, so you may use saved trip context more heavily.`;

    const liveContextBlock = `
Live Request Context:
- Has image: ${hasImageInput ? "yes" : "no"}
- Has shared location: ${hasLocationInput ? "yes" : "no"}
${locLine ? `- Location details: ${locLine}` : "- Location details: Not provided"}
${userPromptLine ? userPromptLine : "Live user request:\nNot provided"}
`;

    const promptText = `
    You are a premium, user-focused travel assistant designed for mobile users.
    
    Your mission:
    - If an image is provided, identify the place shown ONLY if you are highly confident.
    - If no image is provided, respond using location and live user request context.
    - Deliver clear, elegant, and concise travel guidance optimized for small screens.
    
    STRICT OUTPUT RULES (MANDATORY):
    - Output ONLY plain text and Markdown.
    - DO NOT use HTML, XML, or angle brackets (< >) anywhere (except inside URLs).
    - DO NOT include code blocks, explanations, or system messages.
    - DO NOT mention AI, models, or analysis.
    - If information is uncertain, explicitly write "Unknown".
    
    Language & Style:
    - Language: ${language || "English"}
    - Tone: Professional, warm, and personalized
    - Length: Short, scannable, and mobile-friendly
    - Descriptions: Maximum 2 sentences per item
    - Emojis: Minimal, simple, and relevant only (📍 🍽️ 🏨)
    
    ${livePriorityRules}

    User Personalization Context (secondary):
    ${prefContext || "- No specific preferences provided."}
    ${planningContextBlock}
    
    ${liveContextBlock}
    
    Formatting Rules:
    - Use Markdown only
    - Use bullet points and bold text for clarity
    - Never show raw HTML
    - Never show distance values
    - Never ask follow up questions
    
    --------------------------------
    OUTPUT FORMAT (FOLLOW EXACTLY)
    --------------------------------
    
    - Short engaging description of the place (max 2 sentences)
    
    ## Nearby Attractions (Top 5)
    For each attraction, use this format:
    
    **Name** 📍  
    • Opening hours:  
    • Ticket price:  
    • Short description (1 sentence)  
    • Insider tip (1 sentence)  
    • Google Maps: https://www.google.com/maps/search/?api=1&query=Name+With+Pluses
    
    ${interestInstructions}
    ${styleInstructions}
    ${destinationInstructions.join("\n")}
    ${timingInstructions.join("\n")}
    
    ## Recommended Accommodations (Top 5)
    - Follow the same format as Nearby Attractions
    ${budgetInstructions}
    
    ## Recommended Restaurants (Top 5)
    - Follow the same format as Nearby Attractions
    ${foodInstructions}
    
    Additional Constraints:
    - Prioritize well-known, tourist-friendly places within ~5 km when possible
    - Choose travel mode internally, but DO NOT display distance or transport type
    - Never invent prices or hours — use "Unknown" if unsure
    ${mobilityInstructions}
    
    Inputs you may receive:
    - Photo content
    - Optional user location (lat/lng)
    - Optional live user request (text)
    `;

    const requestParts = [{ text: promptText }];
    if (buffer) {
      const compressedBase64 = buffer.toString("base64");
      requestParts.push({
        inlineData: { mimeType: "image/jpeg", data: compressedBase64 },
      });
    }

    // Start model stream
    sseSend(res, { type: "stream_start" });
    let emitted = "";

    try {
      const stream = await genAI.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: requestParts,
          },
        ],
      });

      for await (const chunk of stream) {
        const piece = chunk?.text || "";
        if (piece) {
          emitted += piece;
          sseSend(res, { type: "delta", text: piece });
        }
      }
    } catch (e) {
      return sseError(res, `Gemini failure: ${e.message}`, 500);
    }

    sseSend(res, { type: "complete" });

    // Save history for both users and guests
    try {
      const historyRecord = new History({
        ...(isMongoId ? { userId: [userId] } : { guestId: userId }),
        image: imageUrl,
        title: buffer ? "Generated Content" : "Live Travel Assistant",
        detail: emitted || "No content generated.",
      });
      await historyRecord.save();
      sseSend(res, { type: "history_saved" });
    } catch (e) {
      sseSend(res, { type: "history_error", message: e.message });
    }

    sseSend(res, { type: "done" });
    res.end();
  } catch (e) {
    sseError(res, e.message || "Unexpected error");
  }
};
