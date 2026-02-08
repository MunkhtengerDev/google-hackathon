const TravelPreference = require("../models/TravelPreferences");
const jwt = require("jsonwebtoken");

exports.getPreferences = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const preferences = await TravelPreference.findOne({ userId: decoded.id });

    if (!preferences) {
      return res
        .status(200)
        .json({ message: "No preferences set", data: null });
    }

    return res.status(200).json({ success: true, data: preferences });
  } catch (error) {
    console.error("getPreferences error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.savePreferences = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const {
      travelStyle,
      budgetLevel,
      interests,
      mobilityPreference,
      foodPreferences,
      questionnaire,
    } = req.body;

    const updateDoc = { userId: decoded.id };

    if (travelStyle !== undefined) updateDoc.travelStyle = travelStyle;
    if (budgetLevel !== undefined) updateDoc.budgetLevel = budgetLevel;
    if (interests !== undefined) updateDoc.interests = interests;
    if (mobilityPreference !== undefined) {
      updateDoc.mobilityPreference = mobilityPreference;
    }
    if (foodPreferences !== undefined) updateDoc.foodPreferences = foodPreferences;
    if (questionnaire && typeof questionnaire === "object") {
      updateDoc.questionnaire = questionnaire;
    }

    const preferences = await TravelPreference.findOneAndUpdate(
      { userId: decoded.id },
      { $set: updateDoc },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Preferences saved",
      data: preferences,
    });
  } catch (error) {
    console.error("savePreferences error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.updatePreference = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { field, value } = req.body;

    const allowedFields = [
      "travelStyle",
      "budgetLevel",
      "interests",
      "mobilityPreference",
      "foodPreferences",
      "questionnaire",
      "questionnaire.tripStatus",
      "questionnaire.context",
      "questionnaire.destination",
      "questionnaire.dates",
      "questionnaire.budget",
      "questionnaire.food",
      "questionnaire.mobility",
      "questionnaire.style",
      "questionnaire.group",
      "questionnaire.accommodation",
      "questionnaire.goals",
      "questionnaire.permissions",
      "questionnaire.askedQuestions",
      "questionnaire.rawAnswers",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field" });
    }

    const update = { [field]: value };
    const preferences = await TravelPreference.findOneAndUpdate(
      { userId: decoded.id },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Preference updated",
      data: preferences,
    });
  } catch (error) {
    console.error("updatePreference error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.deletePreferences = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await TravelPreference.findOneAndDelete({ userId: decoded.id });

    return res.status(200).json({
      success: true,
      message: "Preferences deleted",
    });
  } catch (error) {
    console.error("deletePreferences error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
