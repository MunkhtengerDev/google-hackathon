const mongoose = require("mongoose");

const travelPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    travelStyle: {
      type: String,
      enum: ["solo", "couple", "family", "group"],
      default: "solo",
    },
    budgetLevel: {
      type: String,
      enum: ["budget", "mid-range", "luxury"],
      default: "mid-range",
    },
    interests: {
      type: [String],
      enum: [
        "history",
        "food",
        "nature",
        "art",
        "adventure",
        "relaxation",
        "nightlife",
        "shopping",
      ],
      default: [],
    },
    mobilityPreference: {
      type: String,
      enum: ["walking", "transport", "limited"],
      default: "walking",
    },
    foodPreferences: {
      type: [String],
      enum: [
        "local",
        "vegetarian",
        "vegan",
        "halal",
        "kosher",
        "no-restrictions",
      ],
      default: ["no-restrictions"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TravelPreference", travelPreferenceSchema);
