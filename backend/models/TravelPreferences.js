const mongoose = require("mongoose");

const askedQuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const questionnaireSchema = new mongoose.Schema(
  {
    tripStatus: {
      type: String,
      default: "",
    },
    context: {
      homeCountry: { type: String, default: "" },
      departureCity: { type: String, default: "" },
      currency: { type: String, default: "USD" },
    },
    destination: {
      countries: { type: [String], default: [] },
      cities: { type: [String], default: [] },
      regions: { type: [String], default: [] },
      flexibility: { type: String, default: "fixed" },
    },
    dates: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
      durationDays: { type: Number, default: 7 },
      timingPriority: {
        type: [String],
        default: [],
      },
      seasonPref: { type: String, default: "no_preference" },
    },
    budget: {
      currency: { type: String, default: "USD" },
      usdBudget: { type: Number, default: 0 },
      priority: {
        type: String,
        default: "balance",
      },
      spendingStyle: {
        type: String,
        default: "track",
      },
    },
    askedQuestions: {
      type: [askedQuestionSchema],
      default: [],
    },
    rawAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false, strict: false }
);

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
    questionnaire: {
      type: questionnaireSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TravelPreference", travelPreferenceSchema);
