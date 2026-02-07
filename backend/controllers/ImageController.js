require("dotenv").config();
const sharp = require("sharp");
const mongoose = require("mongoose");
const History = require("../models/History");
const { GoogleGenAI } = require("@google/genai");
const TravelPreference = require("../models/TravelPreferences");

// ---- Gemini ----
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) console.warn("Warning: GEMINI_API_KEY not set");
const GEMINI_MODEL = process.env.GEMINI_MODEL_STREAM || "gemini-3-flash-preview";
const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });

// ---- Image constraints ----
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const TARGET_WIDTH = 800;
const LARGE_THRESHOLD = 1.5 * 1024 * 1024;

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
      userId, // Incoming ID (can be MongoDB ObjectId OR Guest UUID)
      language,
    } = req.body || {};

    if (!rawBase64) return sseError(res, "Image data required", 400);
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

    // Normalize base64
    let imageBase64 = rawBase64;
    if (imageBase64.startsWith("data:")) {
      const comma = imageBase64.indexOf(",");
      if (comma !== -1) imageBase64 = imageBase64.slice(comma + 1);
    }

    // Decode + compress using Sharp
    let buffer = Buffer.from(imageBase64, "base64");
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

    if (buffer.length > MAX_IMAGE_BYTES)
      return sseError(res, "Image too large after compression", 400);
    sseSend(res, { type: "image", compressedBytes: buffer.length });

    // Image storage disabled (no Google Cloud). History will save without imageUrl.
    const imageUrl = null;

    // Build location context
    const locLine =
      address || (locationLatitude && locationLongitude)
        ? (address ? `Address: ${address}` : "") +
          (address && locationLatitude ? " | " : "") +
          (locationLatitude && locationLongitude
            ? `Coordinates: ${locationLatitude},${locationLongitude}`
            : "")
        : "";

    // Build personalized preference context for the Prompt
    const prefContext = userPrefs
      ? `
User Preferences:
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

    let budgetInstructions = "";
    if (userPrefs?.budgetLevel === "budget") {
      budgetInstructions =
        "- Focus on hostels, budget hotels, affordable stays, and budget-friendly options.";
    } else if (userPrefs?.budgetLevel === "luxury") {
      budgetInstructions =
        "- Focus on high-end hotels, boutique stays, luxury resorts, and premium options.";
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

    // Build interest-specific instructions
    let interestInstructions = "";
    if (userPrefs?.interests?.length) {
      interestInstructions = `- Prioritize attractions related to: ${userPrefs.interests.join(
        ", "
      )}.`;
    }

    const promptText = `
    You are a premium, user-focused travel assistant designed for mobile users.
    
    Your mission:
    - Identify the place shown in the image ONLY if you are highly confident.
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
    
    User Personalization Context:
    ${prefContext || "- No specific preferences provided."}
    
    Formatting Rules:
    - Use Markdown only
    - Use bullet points and bold text for clarity
    - Never show raw HTML
    - Never show distance values
    
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
    
    ${locLine ? `Context location:\n${locLine}` : ""}
    `;

    const compressedBase64 = buffer.toString("base64");

    // Start model stream
    sseSend(res, { type: "stream_start" });
    let emitted = "";

    try {
      const stream = await genAI.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: { mimeType: "image/jpeg", data: compressedBase64 },
              },
            ],
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
        title: "Generated Content",
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
