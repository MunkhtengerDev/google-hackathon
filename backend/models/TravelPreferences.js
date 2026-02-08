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
      nearbyAirports: { type: Boolean, default: false },
      departureAirportCode: { type: String, default: "" },
    },
    destination: {
      countries: { type: [String], default: [] },
      cities: { type: [String], default: [] },
      regions: { type: [String], default: [] },
      continents: { type: [String], default: [] },
      flexibility: { type: String, default: "fixed" },
      dayTripsPlanned: { type: Boolean, default: false },
    },
    dates: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
      earliestStart: { type: String, default: "" },
      latestStart: { type: String, default: "" },
      durationDays: { type: Number, default: 7 },
      durationRange: {
        min: { type: String, default: "" },
        max: { type: String, default: "" },
      },
      timingPriority: {
        type: [String],
        default: [],
      },
      seasonPref: { type: String, default: "no_preference" },
      canChangeDates: { type: String, default: "no" },
    },
    budget: {
      currency: { type: String, default: "USD" },
      usdBudget: { type: Number, default: 0 },
      budgetType: { type: String, default: "total" },
      savedAmountUsd: { type: Number, default: 0 },
      isFlexible: { type: Boolean, default: true },
      priority: {
        type: String,
        default: "balance",
      },
      spendingStyle: {
        type: String,
        default: "track",
      },
      emergencyBufferUsd: { type: Number, default: 0 },
    },
    food: {
      diet: { type: [String], default: [] },
      importance: { type: String, default: "nice" },
      notes: { type: String, default: "" },
    },
    mobility: {
      preferredTransport: { type: [String], default: [] },
      comfortRange: { type: String, default: "30" },
      notes: { type: String, default: "" },
    },
    style: {
      interests: { type: [String], default: [] },
      tasteText: { type: String, default: "" },
      travelPace: { type: String, default: "balanced" },
      hates: { type: [String], default: [] },
      pastLoved: { type: [String], default: [] },
    },
    group: {
      who: { type: String, default: "solo" },
      adults: { type: Number, default: 1 },
      childrenAges: { type: [Number], default: [] },
      totalPeople: { type: Number, default: 1 },
    },
    accommodation: {
      status: { type: String, default: "not_booked" },
      type: { type: String, default: "" },
      preference: { type: [String], default: [] },
    },
    goals: {
      experienceGoals: { type: [String], default: [] },
      oneSentenceGoal: { type: String, default: "" },
    },
    permissions: {
      allowAltDestinations: { type: Boolean, default: true },
      allowBudgetOptimize: { type: Boolean, default: true },
      allowDailyAdjust: { type: Boolean, default: false },
      allowSaveForFuture: { type: Boolean, default: true },
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
        "city",
        "culture",
        "history",
        "food",
        "nature",
        "art",
        "adventure",
        "relaxation",
        "nightlife",
        "shopping",
        "photography",
      ],
      default: [],
    },
    mobilityPreference: {
      type: String,
      enum: [
        "walking",
        "transport",
        "limited",
        "public_transit",
        "taxi",
        "rental_car",
        "bike",
        "tour_bus",
      ],
      default: "walking",
    },
    foodPreferences: {
      type: [String],
      enum: [
        "local",
        "street",
        "fine_dining",
        "vegetarian",
        "vegan",
        "halal",
        "kosher",
        "seafood",
        "no_preference",
        "no-restrictions",
      ],
      default: ["no_preference"],
    },
    questionnaire: {
      type: questionnaireSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TravelPreference", travelPreferenceSchema);
