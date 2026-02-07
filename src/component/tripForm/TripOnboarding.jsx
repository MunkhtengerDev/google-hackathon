import React, { useEffect, useMemo, useState } from "react";
import PlannerShell from "../../ui/PlannerShell.jsx";
import TransitionScreen from "../../ui/TransitionScreen.jsx";
import { loadFromStorage, saveToStorage, clearStorage } from "../../lib/storage.js";

// Sections
import TripStatusSection from "./sections/TripStatusSection.jsx";
import HomeContextSection from "./sections/HomeContextSection.jsx";
import DestinationSection from "./sections/DestinationSection.jsx";
import SeasonSection from "./sections/SeasonSection.jsx";
import BudgetSection from "./sections/BudgetSection.jsx";

// Visualizers
import MapVisualizer from "./visualizers/MapVisualizer.jsx";
import CalendarVisualizer from "./visualizers/CalendarVisualizer.jsx";
import SummaryVisualizer from "./visualizers/SummaryVisualizer.jsx";

function defaultState() {
  return {
    tripStatus: "planning",

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
  { key: "status", title: "Let’s start.", visual: "summary" },
  { key: "context", title: "Home & Context", visual: "map" },
  { key: "destination", title: "Destination", visual: "map" },
  { key: "season", title: "Timing", visual: "calendar" },
  { key: "budget", title: "Budget", visual: "summary" },
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

// “deep” next-step gating: we show a small transition screen if step is completed
function isStepComplete(stepKey, data) {
  if (stepKey === "status") return !!data.tripStatus;
  if (stepKey === "context") return !!(data.context.homeCountry || data.context.departureCity);
  if (stepKey === "destination") return (data.destination.countries?.length || data.destination.cities?.length || data.destination.regions?.length) > 0;
  if (stepKey === "season") return !!data.dates.start;
  if (stepKey === "budget") return Number(data.budget.usdBudget || 0) > 0;
  return true;
}

export default function TripOnboarding() {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [data, setData] = useState(defaultState());
  const [step, setStep] = useState(0);

  // right side “live query”
  const [rightQuery, setRightQuery] = useState("");

  // transition screen
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    setData((d) => mergeSafe(d, loaded));
  }, []);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const stepConfig = STEPS[step];

  const defaultMapQuery = useMemo(() => {
    if (stepConfig.key === "context") {
      return [data.context.departureCity, data.context.homeCountry].filter(Boolean).join(", ") || "World";
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
    // dedupe
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
        [data.context.departureCity, data.context.homeCountry].filter(Boolean).join(", ");

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
  }, [stepConfig.visual, stepConfig.key, rightQuery, defaultMapQuery, mapsApiKey, markers, data]);

  const resetAll = () => {
    clearStorage();
    setData(defaultState());
    setStep(0);
    setRightQuery("");
    setShowTransition(false);
  };

  const goNext = () => {
    const key = stepConfig.key;
    const complete = isStepComplete(key, data);

    // show micro-transition if user actually completed this step
    if (complete) {
      setShowTransition(true);
      return;
    }

    // if not complete, still allow next (optional). If you want hard-lock, return here.
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setRightQuery("");
  };

  const finishTransition = () => {
    setShowTransition(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setRightQuery("");
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
    setRightQuery("");
  };

  return (
    <PlannerShell
      stepIndex={step}
      stepsCount={STEPS.length}
      title={stepConfig.title}
      rightContent={rightContent}
      onReset={resetAll}
    >
      {showTransition ? (
        <TransitionScreen
          title="Nice."
          subtitle="Moving to the next step…"
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
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-semibold"
            >
              Back
            </button>
            <button
              onClick={goNext}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-[13px] font-semibold shadow-sm"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </PlannerShell>
  );
}
