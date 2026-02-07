import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PlannerShell from "../../ui/PlannerShell.jsx";
import TransitionScreen from "../../ui/TransitionScreen.jsx";
import { loadFromStorage, saveToStorage, clearStorage } from "../../lib/storage.js";

import TripStatusSection from "./sections/TripStatusSection.jsx";
import HomeContextSection from "./sections/HomeContextSection.jsx";
import DestinationSection from "./sections/DestinationSection.jsx";
import SeasonSection from "./sections/SeasonSection.jsx";
import BudgetSection from "./sections/BudgetSection.jsx";

import MapVisualizer from "./visualizers/MapVisualizer.jsx";
import CalendarVisualizer from "./visualizers/CalendarVisualizer.jsx";
import SummaryVisualizer from "./visualizers/SummaryVisualizer.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");

const ALLOWED_INTERESTS = new Set([
  "history",
  "food",
  "nature",
  "art",
  "adventure",
  "relaxation",
  "nightlife",
  "shopping",
]);

function defaultState() {
  return {
    tripStatus: "",
    context: {
      homeCountry: "",
      departureCity: "",
      currency: "USD",
    },
    destination: {
      countries: [],
      cities: [],
      regions: [],
      flexibility: "fixed",
    },
    dates: {
      start: "",
      end: "",
      durationDays: 7,
      timingPriority: [],
      seasonPref: "no_preference",
    },
    budget: {
      currency: "USD",
      usdBudget: 0,
      priority: "balance",
      spendingStyle: "track",
    },
  };
}

const STEPS = [
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
];

function mergeSafe(base, loaded) {
  if (!loaded || typeof loaded !== "object") return base;
  return {
    ...base,
    ...loaded,
    context: { ...base.context, ...(loaded.context || {}) },
    destination: { ...base.destination, ...(loaded.destination || {}) },
    dates: { ...base.dates, ...(loaded.dates || {}) },
    budget: { ...base.budget, ...(loaded.budget || {}) },
  };
}

function isStepComplete(stepKey, data) {
  if (stepKey === "status") {
    return Boolean(data.tripStatus);
  }

  if (stepKey === "context") {
    return Boolean(data.context.homeCountry?.trim()) &&
      Boolean(data.context.departureCity?.trim());
  }

  if (stepKey === "destination") {
    return (
      (data.destination.countries?.length || 0) +
        (data.destination.cities?.length || 0) +
        (data.destination.regions?.length || 0) >
      0
    );
  }

  if (stepKey === "season") {
    if (data.tripStatus === "booked") {
      return Boolean(data.dates.start) && Boolean(data.dates.end);
    }
    return Boolean(data.dates.start);
  }

  if (stepKey === "budget") {
    return (
      Number(data.budget.usdBudget || 0) > 0 &&
      Boolean(data.budget.currency?.trim())
    );
  }

  return true;
}

function mapBudgetLevel(usdBudget) {
  const total = Number(usdBudget || 0);
  if (total <= 1500) return "budget";
  if (total <= 4000) return "mid-range";
  return "luxury";
}

function mapTravelStyle(data) {
  const stopCount =
    (data.destination.countries?.length || 0) +
    (data.destination.cities?.length || 0) +
    (data.destination.regions?.length || 0);

  if (stopCount >= 4) return "group";
  if (data.tripStatus === "booked") return "couple";
  return "solo";
}

function mapInterests(data) {
  const priorityMap = {
    weather: "nature",
    crowds: "relaxation",
    price: "shopping",
  };

  const interests = (data.dates.timingPriority || [])
    .map((item) => priorityMap[item])
    .filter(Boolean);

  if (data.tripStatus === "booked") interests.push("adventure");
  if (Number(data.budget.usdBudget || 0) >= 3500) interests.push("art");

  const unique = Array.from(new Set(interests)).filter((item) =>
    ALLOWED_INTERESTS.has(item)
  );

  return unique.length ? unique : ["nature"];
}

function mapMobilityPreference(data) {
  const destinationSpread =
    (data.destination.cities?.length || 0) + (data.destination.regions?.length || 0);

  if (destinationSpread >= 2) return "transport";
  return "walking";
}

function buildPreferencesPayload(data) {
  return {
    travelStyle: mapTravelStyle(data),
    budgetLevel: mapBudgetLevel(data.budget.usdBudget),
    interests: mapInterests(data),
    mobilityPreference: mapMobilityPreference(data),
    foodPreferences: ["no-restrictions"],
  };
}

export default function TripOnboarding({ token }) {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [data, setData] = useState(() =>
    mergeSafe(defaultState(), loadFromStorage())
  );
  const [step, setStep] = useState(0);
  const [rightQuery, setRightQuery] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const stepConfig = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const canContinue = isStepComplete(stepConfig.key, data);

  const defaultMapQuery = useMemo(() => {
    if (stepConfig.key === "context") {
      return (
        [data.context.departureCity, data.context.homeCountry]
          .filter(Boolean)
          .join(", ") || "World"
      );
    }
    if (stepConfig.key === "destination") {
      const last =
        data.destination.cities?.slice(-1)[0] ||
        data.destination.regions?.slice(-1)[0] ||
        data.destination.countries?.slice(-1)[0];
      return last || "World";
    }
    return "World";
  }, [stepConfig.key, data.context, data.destination]);

  const markers = useMemo(() => {
    const list = [
      ...(data.destination.countries || []),
      ...(data.destination.cities || []),
      ...(data.destination.regions || []),
    ];
    return Array.from(new Set(list)).slice(0, 12);
  }, [data.destination]);

  const rightContent = useMemo(() => {
    if (stepConfig.visual === "map") {
      const query = rightQuery?.trim() ? rightQuery.trim() : defaultMapQuery;
      return (
        <MapVisualizer
          apiKey={mapsApiKey}
          query={query}
          label={stepConfig.key === "context" ? "Home Base" : "Destination"}
          markers={markers}
        />
      );
    }

    if (stepConfig.visual === "calendar") {
      const location =
        data.destination.cities?.[0] ||
        data.destination.countries?.[0] ||
        data.destination.regions?.[0] ||
        [data.context.departureCity, data.context.homeCountry]
          .filter(Boolean)
          .join(", ");

      return (
        <CalendarVisualizer
          startDate={data.dates.start}
          endDate={data.dates.end}
          title="Trip"
          details="Created by Trip Planner"
          location={location}
        />
      );
    }

    return <SummaryVisualizer data={data} />;
  }, [
    stepConfig.visual,
    stepConfig.key,
    rightQuery,
    defaultMapQuery,
    mapsApiKey,
    markers,
    data,
  ]);

  const resetAll = () => {
    clearStorage();
    setData(defaultState());
    setStep(0);
    setRightQuery("");
    setShowTransition(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const saveTravelPreferences = async () => {
    if (!token) {
      setSaveError("Authentication is missing. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPreferencesPayload(data)),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save preferences");
      }

      setSaveSuccess("Travel preferences saved to backend.");
      setShowTransition(true);
    } catch (error) {
      setSaveError(error.message || "Unable to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    if (!canContinue || isSaving) return;

    setSaveError("");

    if (isLastStep) {
      await saveTravelPreferences();
      return;
    }

    setShowTransition(true);
  };

  const finishTransition = () => {
    setShowTransition(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setRightQuery("");
  };

  const goBack = () => {
    if (isSaving) return;
    setSaveError("");
    setStep((s) => Math.max(0, s - 1));
    setRightQuery("");
  };

  return (
    <PlannerShell
      stepIndex={step}
      stepsCount={STEPS.length}
      title={stepConfig.title}
      subtitle={stepConfig.subtitle}
      rightContent={rightContent}
      onReset={resetAll}
    >
      {showTransition ? (
        <TransitionScreen
          title={isLastStep ? "Saved." : "Nice."}
          subtitle={
            isLastStep
              ? "Travel preferences synced with backend."
              : "Moving to the next step."
          }
          onDone={finishTransition}
        />
      ) : (
        <>
          {stepConfig.key === "status" ? (
            <TripStatusSection
              value={data.tripStatus}
              onChange={(v) => setData((d) => ({ ...d, tripStatus: v }))}
            />
          ) : null}

          {stepConfig.key === "context" ? (
            <HomeContextSection
              value={data.context}
              onChange={(v) => setData((d) => ({ ...d, context: v }))}
              mapsApiKey={mapsApiKey}
              onFocusQuery={(q) => setRightQuery(q)}
            />
          ) : null}

          {stepConfig.key === "destination" ? (
            <DestinationSection
              value={data.destination}
              onChange={(v) => setData((d) => ({ ...d, destination: v }))}
              mapsApiKey={mapsApiKey}
              onFocusQuery={(q) => setRightQuery(q)}
            />
          ) : null}

          {stepConfig.key === "season" ? (
            <SeasonSection
              tripStatus={data.tripStatus}
              value={data.dates}
              onChange={(v) => setData((d) => ({ ...d, dates: v }))}
            />
          ) : null}

          {stepConfig.key === "budget" ? (
            <BudgetSection
              tripStatus={data.tripStatus}
              value={data.budget}
              onChange={(v) => setData((d) => ({ ...d, budget: v }))}
            />
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={step === 0 || isSaving}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
                step === 0 || isSaving
                  ? "cursor-not-allowed border-[#dcd1bf] bg-[#f6f1e8] text-[#9aa8ae]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[#385360] hover:border-[var(--line-strong)] hover:bg-[#fff8eb]",
              ].join(" ")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="hidden items-center gap-1.5 md:flex">
              {STEPS.map((item, idx) => (
                <span
                  key={item.key}
                  className={[
                    "h-1.5 rounded-full transition-all",
                    idx <= step ? "w-7 bg-[#0d6a66]" : "w-3 bg-[#d9ccb8]",
                  ].join(" ")}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              disabled={!canContinue || isSaving}
              className={[
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition",
                !canContinue || isSaving
                  ? "cursor-not-allowed bg-[#ccd6d9] text-white"
                  : "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_10px_24px_rgba(12,95,92,0.30)] hover:brightness-105",
              ].join(" ")}
            >
              {isLastStep ? (isSaving ? "Saving..." : "Save Preferences") : "Continue"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {!canContinue ? (
            <p className="mt-3 text-xs font-medium text-[#9a5c32]">
              Fill required fields in this step to continue.
            </p>
          ) : null}

          {saveError ? (
            <p className="mt-3 text-xs font-medium text-[#8b3f2e]">{saveError}</p>
          ) : null}

          {saveSuccess && !showTransition ? (
            <p className="mt-3 text-xs font-medium text-[#245f52]">
              {saveSuccess}
            </p>
          ) : null}
        </>
      )}
    </PlannerShell>
  );
}
