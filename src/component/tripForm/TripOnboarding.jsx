import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

// UI Wrappers
import PlannerShell from "../../ui/PlannerShell.jsx";
import TransitionScreen from "../../ui/TransitionScreen.jsx";

// Sections (Existing)
import TripStatusSection from "./sections/TripStatusSection.jsx";
import HomeContextSection from "./sections/HomeContextSection.jsx";
import DestinationSection from "./sections/DestinationSection.jsx";
import SeasonSection from "./sections/SeasonSection.jsx";
import BudgetSection from "./sections/BudgetSection.jsx";

// Sections (NEW)
import FoodSection from "./sections/FoodSection.jsx";
import MobilitySection from "./sections/MobilitySection.jsx";
import TravelStyleSection from "./sections/TravelStyleSection.jsx";
import GroupSection from "./sections/GroupSection.jsx";
import AccommodationSection from "./sections/AccommodationSection.jsx";
import ExperienceGoalsSection from "./sections/ExperienceGoalsSection.jsx";
import PermissionsSection from "./sections/PermissionsSection.jsx";

// Visualizers
import MapVisualizer from "./visualizers/MapVisualizer.jsx";
import CalendarVisualizer from "./visualizers/CalendarVisualizer.jsx";
import SummaryVisualizer from "./visualizers/SummaryVisualizer.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");

// --- 1. Constants & Helpers ---

const ALLOWED_INTERESTS = new Set([
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
]);

// Definition of ALL possible steps
const ALL_STEPS = [
  {
    key: "status",
    title: "Define Your Journey Type",
    subtitle: "Choose planning mode to tailor recommendations and pacing.",
    visual: "summary",
  },
  {
    key: "context",
    title: "Set Your Home Context",
    subtitle: "Departure location and currency shape the route strategy.",
    visual: "map",
  },
  {
    key: "destination",
    title: "Shape The Destination Map",
    subtitle: "Add multiple countries, cities, or regions for route planning.",
    visual: "map",
  },
  {
    key: "season",
    title: "Tune Timing & Seasonality",
    subtitle: "Balance weather, crowds, and value windows for better timing.",
    visual: "calendar",
  },
  {
    key: "budget",
    title: "Engineer The Budget",
    subtitle: "Set cost priorities so the plan fits your travel style.",
    visual: "summary",
  },
  // --- New Core Steps ---
  {
    key: "food",
    title: "Food Preferences",
    subtitle: "Tell us what you want to eat (or avoid) for better recommendations.",
    visual: "summary",
  },
  {
    key: "mobility",
    title: "Mobility & Movement",
    subtitle: "Optimize routes and hotel placement based on your comfort range.",
    visual: "map",
  },
  {
    key: "style",
    title: "Travel Style & Interests",
    subtitle: "Pick interests and describe your taste for deeper personalization.",
    visual: "summary",
  },
  // --- Booked Only Steps ---
  {
    key: "group",
    title: "Group Composition",
    subtitle: "Right pacing and filters for families, couples, and groups.",
    visual: "summary",
    condition: (data) => data.tripStatus === "booked",
  },
  {
    key: "accommodation",
    title: "Accommodation Status",
    subtitle: "Map-centric planning works best when we know where you’ll stay.",
    visual: "map",
    condition: (data) => data.tripStatus === "booked",
  },
  {
    key: "goals",
    title: "Experience Goals",
    subtitle: "This becomes the narrative anchor for the itinerary.",
    visual: "summary",
    condition: (data) => data.tripStatus === "booked",
  },
  // --- Permissions ---
  {
    key: "permissions",
    title: "AI Permissions",
    subtitle: "Control how the AI can optimize and remember your preferences.",
    visual: "summary",
  },
];

function defaultState() {
  return {
    tripStatus: "", // "planning" | "booked"
    context: {
      homeCountry: "",
      departureCity: "",
      currency: "USD",
      nearbyAirports: false,
      departureAirportCode: "",
    },
    destination: {
      countries: [],
      cities: [],
      regions: [],
      continents: [],
      flexibility: "fixed",
      dayTripsPlanned: false,
    },
    dates: {
      start: "",
      end: "",
      earliestStart: "",
      latestStart: "",
      durationDays: 7,
      durationRange: { min: "", max: "" },
      canChangeDates: "no",
      timingPriority: [],
      seasonPref: "no_preference",
    },
    budget: {
      currency: "USD",
      usdBudget: 0,
      budgetType: "total",
      savedAmountUsd: 0,
      isFlexible: true,
      priority: "balance",
      spendingStyle: "track",
      emergencyBufferUsd: 0,
    },
    food: {
      diet: [],
      importance: "nice",
      notes: "",
    },
    mobility: {
      preferredTransport: [],
      comfortRange: "30",
      notes: "",
    },
    style: {
      interests: [],
      tasteText: "",
      travelPace: "balanced",
      hates: [],
      pastLoved: [],
    },
    group: {
      who: "solo",
      adults: 1,
      childrenAges: [],
      totalPeople: 1,
    },
    accommodation: {
      status: "not_booked",
      type: "",
      preference: [],
    },
    goals: {
      experienceGoals: [],
      oneSentenceGoal: "",
    },
    permissions: {
      allowAltDestinations: true,
      allowBudgetOptimize: true,
      allowDailyAdjust: false,
      allowSaveForFuture: true,
    },
  };
}

function mergePlannerData(base, loaded) {
  if (!loaded || typeof loaded !== "object") return base;
  // Deep merge for all sections
  return {
    ...base,
    ...loaded,
    context: { ...base.context, ...(loaded.context || {}) },
    destination: { ...base.destination, ...(loaded.destination || {}) },
    dates: { ...base.dates, ...(loaded.dates || {}) },
    budget: { ...base.budget, ...(loaded.budget || {}) },
    food: { ...base.food, ...(loaded.food || {}) },
    mobility: { ...base.mobility, ...(loaded.mobility || {}) },
    style: { ...base.style, ...(loaded.style || {}) },
    group: { ...base.group, ...(loaded.group || {}) },
    accommodation: { ...base.accommodation, ...(loaded.accommodation || {}) },
    goals: { ...base.goals, ...(loaded.goals || {}) },
    permissions: { ...base.permissions, ...(loaded.permissions || {}) },
  };
}

function isStepComplete(stepKey, data) {
  switch (stepKey) {
    case "status":
      return Boolean(data.tripStatus);
    case "context":
      return (
        Boolean(data.context.homeCountry?.trim()) &&
        Boolean(data.context.departureCity?.trim())
      );
    case "destination":
      return (
        (data.destination.countries?.length || 0) +
          (data.destination.cities?.length || 0) +
          (data.destination.regions?.length || 0) > 0
      );
    case "season":
      if (data.tripStatus === "booked") {
        return Boolean(data.dates.start) && Boolean(data.dates.end);
      }
      return Boolean(data.dates.start);
    case "budget":
      return (
        Number(data.budget.usdBudget || 0) > 0 &&
        Boolean(data.budget.currency?.trim())
      );
    case "food":
      // require at least importance
      return Boolean(data.food?.importance);
    case "mobility":
      // require at least one transport mode
      return (data.mobility?.preferredTransport?.length || 0) > 0;
    case "style":
      // optional, but encourage interaction. Let's make it always valid.
      return true;
    case "group":
      if (data.tripStatus !== "booked") return true;
      return Boolean(data.group?.who);
    case "accommodation":
      if (data.tripStatus !== "booked") return true;
      return Boolean(data.accommodation?.status);
    case "goals":
      if (data.tripStatus !== "booked") return true;
      return (
        (data.goals?.experienceGoals?.length || 0) > 0 ||
        Boolean(data.goals?.oneSentenceGoal?.trim())
      );
    case "permissions":
      return true;
    default:
      return true;
  }
}

// --- Payload Construction ---

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  const cleaned = values.map((item) => normalizeText(item)).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function addAskedQuestion(list, key, question, answer) {
  list.push({ key, question, answer });
}

function deriveTravelStyle(questionnaire) {
  if (questionnaire.tripStatus !== "booked") return "solo";

  const groupType = questionnaire.group?.who;
  if (groupType === "couple") return "couple";
  if (groupType === "family") return "family";
  if (groupType === "friends") return "group";
  if (groupType === "solo") return "solo";
  return "solo";
}

function deriveMobilityPreference(questionnaire) {
  const transportModes = normalizeStringArray(
    questionnaire.mobility?.preferredTransport
  );
  const mobilityNotes = normalizeText(questionnaire.mobility?.notes).toLowerCase();

  const hasLimitedMobilityHints =
    mobilityNotes.includes("wheelchair") ||
    mobilityNotes.includes("limited") ||
    mobilityNotes.includes("avoid stairs");
  if (hasLimitedMobilityHints) return "limited";

  const nonWalkingModes = transportModes.filter((mode) => mode !== "walking");
  if (nonWalkingModes.length > 0) return "transport";
  return "walking";
}

function buildPreferencesPayload(data) {
  // Construct the main JSON structure
  const questionnaire = {
    tripStatus: normalizeText(data.tripStatus),
    context: {
      homeCountry: normalizeText(data.context?.homeCountry),
      departureCity: normalizeText(data.context?.departureCity),
      currency: normalizeText(data.context?.currency) || "USD",
      nearbyAirports: Boolean(data.context?.nearbyAirports),
      departureAirportCode: normalizeText(data.context?.departureAirportCode),
    },
    destination: {
      countries: normalizeStringArray(data.destination?.countries),
      cities: normalizeStringArray(data.destination?.cities),
      regions: normalizeStringArray(data.destination?.regions),
      continents: normalizeStringArray(data.destination?.continents),
      flexibility: normalizeText(data.destination?.flexibility) || "fixed",
      dayTripsPlanned: Boolean(data.destination?.dayTripsPlanned),
    },
    dates: {
      start: normalizeText(data.dates?.start),
      end: normalizeText(data.dates?.end),
      durationDays: Number(data.dates?.durationDays || 7),
      timingPriority: normalizeStringArray(data.dates?.timingPriority),
      seasonPref: normalizeText(data.dates?.seasonPref) || "no_preference",
      canChangeDates: normalizeText(data.dates?.canChangeDates) || "no",
    },
    budget: {
      currency: normalizeText(data.budget?.currency) || "USD",
      usdBudget: Number(data.budget?.usdBudget || 0),
      priority: normalizeText(data.budget?.priority) || "balance",
      spendingStyle: normalizeText(data.budget?.spendingStyle) || "track",
      budgetType: normalizeText(data.budget?.budgetType) || "total",
    },
    food: {
      diet: normalizeStringArray(data.food?.diet),
      importance: normalizeText(data.food?.importance) || "nice",
      notes: normalizeText(data.food?.notes),
    },
    mobility: {
      preferredTransport: normalizeStringArray(data.mobility?.preferredTransport),
      comfortRange: normalizeText(data.mobility?.comfortRange) || "30",
      notes: normalizeText(data.mobility?.notes),
    },
    style: {
      interests: normalizeStringArray(data.style?.interests),
      tasteText: normalizeText(data.style?.tasteText),
      travelPace: normalizeText(data.style?.travelPace) || "balanced",
      hates: normalizeStringArray(data.style?.hates),
      pastLoved: Array.isArray(data.style?.pastLoved)
        ? data.style.pastLoved
        : [],
    },
    group: {
      who: normalizeText(data.group?.who),
      adults: Number(data.group?.adults || 0),
      childrenAges: Array.isArray(data.group?.childrenAges)
        ? data.group.childrenAges
        : [],
      totalPeople: Number(data.group?.totalPeople || 0),
    },
    accommodation: {
      status: normalizeText(data.accommodation?.status),
      type: normalizeText(data.accommodation?.type),
      preference: normalizeStringArray(data.accommodation?.preference),
    },
    goals: {
      experienceGoals: normalizeStringArray(data.goals?.experienceGoals),
      oneSentenceGoal: normalizeText(data.goals?.oneSentenceGoal),
    },
    permissions: {
      allowAltDestinations: Boolean(data.permissions?.allowAltDestinations),
      allowBudgetOptimize: Boolean(data.permissions?.allowBudgetOptimize),
      allowDailyAdjust: Boolean(data.permissions?.allowDailyAdjust),
      allowSaveForFuture: Boolean(data.permissions?.allowSaveForFuture),
    },
  };

  // Construct flat question/answer list for AI context (all asked questions)
  const askedQuestions = [];

  addAskedQuestion(
    askedQuestions,
    "tripStatus",
    "What is your trip status?",
    questionnaire.tripStatus
  );

  addAskedQuestion(
    askedQuestions,
    "context.homeCountry",
    "What is your home country?",
    questionnaire.context.homeCountry
  );
  addAskedQuestion(
    askedQuestions,
    "context.departureCity",
    "What is your departure city?",
    questionnaire.context.departureCity
  );
  addAskedQuestion(
    askedQuestions,
    "context.currency",
    "What currency should be used?",
    questionnaire.context.currency
  );
  addAskedQuestion(
    askedQuestions,
    "context.nearbyAirports",
    "Should nearby airports be considered?",
    questionnaire.context.nearbyAirports
  );
  addAskedQuestion(
    askedQuestions,
    "context.departureAirportCode",
    "Do you have a preferred departure airport code?",
    questionnaire.context.departureAirportCode
  );

  addAskedQuestion(
    askedQuestions,
    "destination.countries",
    "Which destination countries do you want?",
    questionnaire.destination.countries
  );
  addAskedQuestion(
    askedQuestions,
    "destination.cities",
    "Which destination cities do you want?",
    questionnaire.destination.cities
  );
  addAskedQuestion(
    askedQuestions,
    "destination.regions",
    "Which destination regions/areas do you want?",
    questionnaire.destination.regions
  );
  addAskedQuestion(
    askedQuestions,
    "destination.continents",
    "Any preferred continents?",
    questionnaire.destination.continents
  );
  addAskedQuestion(
    askedQuestions,
    "destination.flexibility",
    "How flexible are your destinations?",
    questionnaire.destination.flexibility
  );
  addAskedQuestion(
    askedQuestions,
    "destination.dayTripsPlanned",
    "Do you want day trips included?",
    questionnaire.destination.dayTripsPlanned
  );

  addAskedQuestion(
    askedQuestions,
    "dates.start",
    "What is your start date?",
    questionnaire.dates.start
  );
  addAskedQuestion(
    askedQuestions,
    "dates.end",
    "What is your end date?",
    questionnaire.dates.end
  );
  addAskedQuestion(
    askedQuestions,
    "dates.durationDays",
    "How many travel days do you want?",
    questionnaire.dates.durationDays
  );
  addAskedQuestion(
    askedQuestions,
    "dates.canChangeDates",
    "Can your dates be changed?",
    questionnaire.dates.canChangeDates
  );
  addAskedQuestion(
    askedQuestions,
    "dates.timingPriority",
    "What timing priorities matter most?",
    questionnaire.dates.timingPriority
  );
  addAskedQuestion(
    askedQuestions,
    "dates.seasonPref",
    "What is your season preference?",
    questionnaire.dates.seasonPref
  );

  addAskedQuestion(
    askedQuestions,
    "budget.currency",
    "What budget display currency do you prefer?",
    questionnaire.budget.currency
  );
  addAskedQuestion(
    askedQuestions,
    "budget.usdBudget",
    "What is your total budget in USD?",
    questionnaire.budget.usdBudget
  );
  addAskedQuestion(
    askedQuestions,
    "budget.budgetType",
    "Is this budget total or per day?",
    questionnaire.budget.budgetType
  );
  addAskedQuestion(
    askedQuestions,
    "budget.priority",
    "What is your budget priority?",
    questionnaire.budget.priority
  );
  addAskedQuestion(
    askedQuestions,
    "budget.spendingStyle",
    "What is your spending style?",
    questionnaire.budget.spendingStyle
  );
  addAskedQuestion(
    askedQuestions,
    "budget.savedAmountUsd",
    "How much have you already saved (USD)?",
    questionnaire.budget.savedAmountUsd
  );
  addAskedQuestion(
    askedQuestions,
    "budget.isFlexible",
    "Is your budget flexible?",
    questionnaire.budget.isFlexible
  );
  addAskedQuestion(
    askedQuestions,
    "budget.emergencyBufferUsd",
    "Do you have an emergency buffer (USD)?",
    questionnaire.budget.emergencyBufferUsd
  );

  addAskedQuestion(
    askedQuestions,
    "food.importance",
    "How important is food for this trip?",
    questionnaire.food.importance
  );
  addAskedQuestion(
    askedQuestions,
    "food.diet",
    "What are your food preferences or restrictions?",
    questionnaire.food.diet
  );
  addAskedQuestion(
    askedQuestions,
    "food.notes",
    "Any allergy or food notes?",
    questionnaire.food.notes
  );

  addAskedQuestion(
    askedQuestions,
    "mobility.preferredTransport",
    "How do you prefer to move around?",
    questionnaire.mobility.preferredTransport
  );
  addAskedQuestion(
    askedQuestions,
    "mobility.comfortRange",
    "What is your comfort travel range?",
    questionnaire.mobility.comfortRange
  );
  addAskedQuestion(
    askedQuestions,
    "mobility.notes",
    "Any mobility notes?",
    questionnaire.mobility.notes
  );

  addAskedQuestion(
    askedQuestions,
    "style.interests",
    "What interests do you want to prioritize?",
    questionnaire.style.interests
  );
  addAskedQuestion(
    askedQuestions,
    "style.travelPace",
    "What travel pace do you prefer?",
    questionnaire.style.travelPace
  );
  addAskedQuestion(
    askedQuestions,
    "style.hates",
    "What do you want to avoid?",
    questionnaire.style.hates
  );
  addAskedQuestion(
    askedQuestions,
    "style.tasteText",
    "How would you describe your travel taste?",
    questionnaire.style.tasteText
  );
  addAskedQuestion(
    askedQuestions,
    "style.pastLoved",
    "Any past places/experiences you loved?",
    questionnaire.style.pastLoved
  );

  if (questionnaire.tripStatus === "booked") {
    askedQuestions.push(
      {
        key: "group.who",
        question: "Who are you traveling with?",
        answer: questionnaire.group.who,
      },
      {
        key: "group.totalPeople",
        question: "How many people are in your group?",
        answer: questionnaire.group.totalPeople,
      },
      {
        key: "group.adults",
        question: "How many adults are in your group?",
        answer: questionnaire.group.adults,
      },
      {
        key: "group.childrenAges",
        question: "What are children ages in your group?",
        answer: questionnaire.group.childrenAges,
      },
      {
        key: "accommodation.status",
        question: "What is your accommodation booking status?",
        answer: questionnaire.accommodation.status,
      },
      {
        key: "accommodation.type",
        question: "What accommodation type do you prefer?",
        answer: questionnaire.accommodation.type,
      },
      {
        key: "accommodation.preference",
        question: "What accommodation location preferences matter?",
        answer: questionnaire.accommodation.preference,
      },
      {
        key: "goals.experienceGoals",
        question: "What are your top experience goals?",
        answer: questionnaire.goals.experienceGoals,
      },
      {
        key: "goals.oneSentenceGoal",
        question: "What is your one-sentence trip goal?",
        answer: questionnaire.goals.oneSentenceGoal,
      }
    );
  }

  addAskedQuestion(
    askedQuestions,
    "permissions.allowAltDestinations",
    "Can AI suggest alternative destinations?",
    questionnaire.permissions.allowAltDestinations
  );
  addAskedQuestion(
    askedQuestions,
    "permissions.allowBudgetOptimize",
    "Can AI optimize your budget automatically?",
    questionnaire.permissions.allowBudgetOptimize
  );
  addAskedQuestion(
    askedQuestions,
    "permissions.allowDailyAdjust",
    "Can AI adjust your plan daily?",
    questionnaire.permissions.allowDailyAdjust
  );
  addAskedQuestion(
    askedQuestions,
    "permissions.allowSaveForFuture",
    "Can AI save your preferences for future trips?",
    questionnaire.permissions.allowSaveForFuture
  );

  const normalizedDiets = normalizeStringArray(data.food?.diet);

  return {
    // Derived high-level tags for easy filtering
    travelStyle: deriveTravelStyle(questionnaire),
    budgetLevel: mapBudgetLevel(questionnaire.budget.usdBudget),
    interests: normalizeStringArray(data.style?.interests).filter((item) =>
      ALLOWED_INTERESTS.has(item)
    ),
    mobilityPreference: deriveMobilityPreference(questionnaire),
    foodPreferences: normalizedDiets.length > 0 ? normalizedDiets : ["no_preference"],

    // The full detailed object
    questionnaire: {
      ...questionnaire,
      askedQuestions,
      rawAnswers: data,
    },
  };
}

function mapBudgetLevel(usdBudget) {
  const total = Number(usdBudget || 0);
  if (total <= 1500) return "budget";
  if (total <= 4000) return "mid-range";
  return "luxury";
}

// --- 2. Main Component ---

export default function TripOnboarding({ token, onCompleted, initialData }) {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // State
  const [data, setData] = useState(() =>
    mergePlannerData(defaultState(), initialData)
  );
  const [step, setStep] = useState(0);
  const [rightQuery, setRightQuery] = useState("");
  
  // Transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState("");

  // Saving/API
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Filter Steps based on Trip Status (Planning vs Booked)
  const visibleSteps = useMemo(() => {
    return ALL_STEPS.filter((s) => {
      if (!s.condition) return true;
      return s.condition(data);
    });
  }, [data.tripStatus]);

  const stepConfig = visibleSteps[step];
  const stepsCount = visibleSteps.length;
  const isLastStep = step === stepsCount - 1;
  const canContinue = isStepComplete(stepConfig?.key, data);

  // Map Logic
  const defaultMapQuery = useMemo(() => {
    if (!stepConfig) return "World";
    if (stepConfig.key === "context") {
      return (
        [data.context.departureCity, data.context.homeCountry]
          .filter(Boolean)
          .join(", ") || "World"
      );
    }
    if (stepConfig.key === "destination" || stepConfig.key === "mobility") {
      const last =
        data.destination.cities?.slice(-1)[0] ||
        data.destination.regions?.slice(-1)[0] ||
        data.destination.countries?.slice(-1)[0];
      return last || "World";
    }
    return "World";
  }, [stepConfig, data.context, data.destination]);

  const markers = useMemo(() => {
    const list = [
      ...(data.destination.countries || []),
      ...(data.destination.cities || []),
      ...(data.destination.regions || []),
    ];
    return Array.from(new Set(list)).slice(0, 12);
  }, [data.destination]);

  // Visualizer Switcher
  const rightContent = useMemo(() => {
    if (!stepConfig) return null;

    if (stepConfig.visual === "map") {
      const query = rightQuery?.trim() ? rightQuery.trim() : defaultMapQuery;
      return (
        <MapVisualizer
          apiKey={mapsApiKey}
          query={query}
          label={
            stepConfig.key === "context" ? "Home Base" : "Destination Preview"
          }
          markers={markers}
        />
      );
    }

    if (stepConfig.visual === "calendar") {
      const location =
        data.destination.cities?.[0] ||
        data.destination.countries?.[0] ||
        "Trip";

      return (
        <CalendarVisualizer
          startDate={data.dates.start}
          endDate={data.dates.end}
          title="Trip Plan"
          location={location}
        />
      );
    }

    return <SummaryVisualizer data={data} />;
  }, [
    stepConfig,
    rightQuery,
    defaultMapQuery,
    mapsApiKey,
    markers,
    data,
  ]);

  // --- Handlers ---

  const handleStartOver = () => {
    if (
      window.confirm(
        "Are you sure you want to start over? Your progress will be lost."
      )
    ) {
      setData(mergePlannerData(defaultState(), initialData));
      setStep(0);
      setRightQuery("");
      setSaveError("");
      setIsTransitioning(false);
      setTransitionMsg("");
    }
  };

  const saveTravelPreferences = async () => {
    if (!token) {
      setSaveError("Authentication is missing. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const preferencesPayload = buildPreferencesPayload(data);

      // 1. Save Preferences
      const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferencesPayload),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      // 2. Generate Trip Plan
      const planningResponse = await fetch(
        `${API_BASE_URL}/api/v1/trip-planning/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const planningPayload = await planningResponse.json();
      if (!planningResponse.ok) {
        throw new Error("Preferences saved, but generation failed");
      }

      onCompleted?.({
        plannerData: mergePlannerData(defaultState(), data),
        tripPlan: planningPayload?.data?.plan,
      });
    } catch (error) {
      setSaveError(error.message || "Unable to save preferences");
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (!canContinue || isSaving) return;
    setSaveError("");

    if (isLastStep) {
      setTransitionMsg("Building your dream itinerary...");
      setIsTransitioning(true);
      await saveTravelPreferences();
      return;
    }

    // Witty messages based on current step key
    const key = stepConfig?.key;
    let msg = "Got it.";
    if (key === "status") msg = "Great start.";
    if (key === "destination") msg = "Excellent choice.";
    if (key === "food") msg = "Yum.";
    if (key === "style") msg = "Noted.";
    if (key === "budget") msg = "Crunching the numbers...";

    setTransitionMsg(msg);
    setIsTransitioning(true);
  };

  const handleTransitionDone = () => {
    if (isSaving) return;
    setIsTransitioning(false);
    setStep((s) => s + 1);
    setRightQuery("");
  };

  const handleBack = () => {
    if (isSaving || step === 0) return;
    setStep((s) => s - 1);
    setRightQuery("");
  };

  // --- Render ---

  return (
    <PlannerShell
      stepIndex={step}
      stepsCount={stepsCount}
      title={stepConfig?.title}
      subtitle={stepConfig?.subtitle}
      rightContent={rightContent}
      onReset={handleStartOver}
      onBack={handleBack}
    >
      {/* 1. Interstitial Transition Overlay */}
      {isTransitioning && (
        <TransitionScreen
          onDone={handleTransitionDone}
          customMessage={transitionMsg}
          persist={isLastStep && isSaving}
        />
      )}

      {/* 2. Main Form Content */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {stepConfig?.key === "status" && (
          <TripStatusSection
            value={data.tripStatus}
            onChange={(v) => setData((d) => ({ ...d, tripStatus: v }))}
          />
        )}

        {stepConfig?.key === "context" && (
          <HomeContextSection
            value={data.context}
            onChange={(v) => setData((d) => ({ ...d, context: v }))}
            mapsApiKey={mapsApiKey}
            onFocusQuery={(q) => setRightQuery(q)}
          />
        )}

        {stepConfig?.key === "destination" && (
          <DestinationSection
            value={data.destination}
            onChange={(v) => setData((d) => ({ ...d, destination: v }))}
            mapsApiKey={mapsApiKey}
            onFocusQuery={(q) => setRightQuery(q)}
          />
        )}

        {stepConfig?.key === "season" && (
          <SeasonSection
            tripStatus={data.tripStatus}
            value={data.dates}
            onChange={(v) => setData((d) => ({ ...d, dates: v }))}
          />
        )}

        {stepConfig?.key === "budget" && (
          <BudgetSection
            tripStatus={data.tripStatus}
            value={data.budget}
            onChange={(v) => setData((d) => ({ ...d, budget: v }))}
          />
        )}

        {stepConfig?.key === "food" && (
          <FoodSection
            tripStatus={data.tripStatus}
            value={data.food}
            onChange={(v) => setData((d) => ({ ...d, food: v }))}
          />
        )}

        {stepConfig?.key === "mobility" && (
          <MobilitySection
            tripStatus={data.tripStatus}
            value={data.mobility}
            onChange={(v) => setData((d) => ({ ...d, mobility: v }))}
            mapsApiKey={mapsApiKey}
            onFocusQuery={(q) => setRightQuery(q)}
          />
        )}

        {stepConfig?.key === "style" && (
          <TravelStyleSection
            tripStatus={data.tripStatus}
            value={data.style}
            onChange={(v) => setData((d) => ({ ...d, style: v }))}
          />
        )}

        {stepConfig?.key === "group" && (
          <GroupSection
            tripStatus={data.tripStatus}
            value={data.group}
            onChange={(v) => setData((d) => ({ ...d, group: v }))}
          />
        )}

        {stepConfig?.key === "accommodation" && (
          <AccommodationSection
            tripStatus={data.tripStatus}
            value={data.accommodation}
            onChange={(v) => setData((d) => ({ ...d, accommodation: v }))}
            mapsApiKey={mapsApiKey}
            onFocusQuery={(q) => setRightQuery(q)}
          />
        )}

        {stepConfig?.key === "goals" && (
          <ExperienceGoalsSection
            tripStatus={data.tripStatus}
            value={data.goals}
            onChange={(v) => setData((d) => ({ ...d, goals: v }))}
          />
        )}

        {stepConfig?.key === "permissions" && (
          <PermissionsSection
            tripStatus={data.tripStatus}
            value={data.permissions}
            onChange={(v) => setData((d) => ({ ...d, permissions: v }))}
          />
        )}

        {/* 3. Navigation Buttons */}
        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={handleNext}
            disabled={!canContinue || isSaving}
            className={`
               h-14 px-8 rounded-full font-semibold text-lg flex items-center gap-3 transition-all duration-300
               ${
                 canContinue
                   ? "bg-[#FF385C] text-white shadow-lg hover:scale-105 hover:shadow-xl"
                   : "bg-gray-200 text-gray-400 cursor-not-allowed"
               }
             `}
          >
            {isLastStep ? "Generate Plan" : "Continue"}
            {isSaving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        </div>

        {/* 4. Feedback */}
        {saveError && (
          <p className="mt-4 text-sm font-medium text-[#c13515] bg-[#ffeae6] p-3 rounded-lg border border-[#ffaeb0]">
            {saveError}
          </p>
        )}
      </div>
    </PlannerShell>
  );
}
