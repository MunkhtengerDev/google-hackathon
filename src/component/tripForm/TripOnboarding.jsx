import React, { useEffect, useMemo, useState } from "react";

// UI shell + transition
import PlannerShell  from "../../ui/PlannerShell.jsx";
import TransitionScreen from "../../ui/TransitionScreen";
// storage
import { loadFromStorage, saveToStorage, clearStorage } from "./storage";

// your split sections
import TripStatusSection from "./TripStatusSection";
import DestinationSection from "./DestinationSection";
import SeasonSection from "./SeasonSection";
import BudgetSection from "./BudgetSection";
import FoodSection from "./FoodSection";
import MobilitySection from "./MobilitySection";
import PreferencesSection from "./PreferencesSection";
import PlanningInsightsSection from "./PlanningInsightsSection";

// ----------------------------------
// step config
// ----------------------------------
const STEPS = [
  {
    key: "status",
    title: "Let’s start.",
    transition: { title: "Got it.", subtitle: "Next: destination." },
  },
  {
    key: "destination",
    title: "Destination",
    transition: { title: "Perfect.", subtitle: "Next: travel timing." },
  },
  {
    key: "season",
    title: "Timing",
    transition: { title: "Nice.", subtitle: "Next: budget." },
  },
  {
    key: "budget",
    title: "Budget",
    transition: { title: "Great.", subtitle: "Next: food preferences." },
  },
  {
    key: "food",
    title: "Food",
    transition: { title: "Yum.", subtitle: "Next: mobility." },
  },
  {
    key: "mobility",
    title: "Mobility",
    transition: { title: "Awesome.", subtitle: "Next: travel style." },
  },
  {
    key: "prefs",
    title: "Your style",
    transition: { title: "All set.", subtitle: "Next: insights." },
  },
  {
    key: "insights",
    title: "Insights",
    // last step no transition
  },
];

// ----------------------------------
// defaults
// ----------------------------------
function defaultState() {
  return {
    tripStatus: "planning", // "planning" | "booked"
    destination: { country: "", city: "", notes: "" },

    // NOTE: keep your same fields used by your own SeasonSection
    // If your SeasonSection uses "duration" not "durationDays", keep "duration".
    dates: {
      start: "",
      end: "",
      duration: 7, // for planning mode
      seasonPref: "no_preference",
      flexibility: [],
    },

    // If your BudgetSection expects { currency, usdBudget, usdSavings } use that,
    // If it expects { total, savings } then keep those.
    // I'll support BOTH by storing BOTH and your sections can use whichever.
    budget: {
      currency: "USD",
      usdBudget: 0,
      usdSavings: 0,
      total: 0,
      savings: 0,
    },

    food: { types: [], otherText: "", other: "" },
    mobility: { modes: [], notes: "" },

    // Also support both style shapes
    prefs: { tags: [], text: "" },
    travelStyle: { description: "", interests: [] },
  };
}

export default function TripOnboarding() {
  const [data, setData] = useState(defaultState());
  const [step, setStep] = useState(0);
  const [showTransition, setShowTransition] = useState(false);

  const stepsCount = STEPS.length;
  const stepKey = STEPS[step]?.key;
  const transitionCopy = STEPS[step]?.transition;

  // Load storage once
  useEffect(() => {
    const cached = loadFromStorage?.();
    if (cached) {
      setData((d) => ({ ...d, ...cached }));
    }
  }, []);

  // Save to storage on every change
  useEffect(() => {
    saveToStorage?.(data);
  }, [data]);

  // Validation per step
  const canNext = useMemo(() => {
    if (stepKey === "destination") {
      return Boolean(data.destination?.country?.trim());
    }
    // everything else optional by default
    return true;
  }, [stepKey, data.destination]);

  const goNext = () => {
    if (!canNext) return;
    if (step >= stepsCount - 1) return;

    // show transition if there is a transition copy
    if (transitionCopy) {
      setShowTransition(true);
      return;
    }

    setStep((s) => Math.min(stepsCount - 1, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onTransitionDone = () => {
    setShowTransition(false);
    setStep((s) => Math.min(stepsCount - 1, s + 1));
  };

  const resetAll = () => {
    clearStorage?.();
    setData(defaultState());
    setStep(0);
    setShowTransition(false);
  };

  const renderStep = () => {
    switch (stepKey) {
      case "status":
        return (
          <TripStatusSection
            value={data.tripStatus}
            onChange={(tripStatus) => setData((d) => ({ ...d, tripStatus }))}
          />
        );

      case "destination":
        return (
          <DestinationSection
            tripStatus={data.tripStatus}
            value={data.destination}
            onChange={(destination) => setData((d) => ({ ...d, destination }))}
          />
        );

      case "season":
        return (
          <SeasonSection
            tripStatus={data.tripStatus}
            value={data.dates}
            onChange={(dates) => setData((d) => ({ ...d, dates }))}
          />
        );

      case "budget":
        return (
          <BudgetSection
            value={data.budget}
            onChange={(budget) =>
              setData((d) => ({
                ...d,
                budget: {
                  ...d.budget,
                  ...budget,
                },
              }))
            }
          />
        );

      case "food":
        return (
          <FoodSection
            value={data.food}
            onChange={(food) => setData((d) => ({ ...d, food }))}
          />
        );

      case "mobility":
        return (
          <MobilitySection
            value={data.mobility}
            onChange={(mobility) => setData((d) => ({ ...d, mobility }))}
          />
        );

      case "prefs":
        return (
          <PreferencesSection
            value={data.prefs ?? data.travelStyle}
            onChange={(prefsOrStyle) =>
              setData((d) => ({
                ...d,
                prefs: prefsOrStyle, // your new components use prefs
                travelStyle: prefsOrStyle, // your old ones might use travelStyle
              }))
            }
          />
        );

      case "insights":
        return (
          <PlanningInsightsSection
            destination={data.destination}
            budget={data.budget}
            dates={data.dates}
          />
        );

      default:
        return null;
    }
  };

  return (
    <PlannerShell stepIndex={step} stepsCount={stepsCount} title={STEPS[step]?.title}>
      {/* optional "start over" */}
      <div className="mb-4 flex justify-end">
        {step > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="text-[12px] font-medium text-slate-500 hover:text-slate-900"
          >
            Start over
          </button>
        ) : null}
      </div>

      {/* transition screen */}
      {showTransition && transitionCopy ? (
        <TransitionScreen
          title={transitionCopy.title}
          subtitle={transitionCopy.subtitle}
          onDone={onTransitionDone}
          ms={700}
        />
      ) : (
        <>
          {renderStep()}

          {/* bottom nav */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className={[
                "px-5 py-3 rounded-[14px] border text-[13px] font-medium transition-all",
                step === 0
                  ? "border-slate-200 text-slate-400 bg-white"
                  : "border-slate-200 text-slate-700 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={!canNext || step === stepsCount - 1}
              className={[
                "px-5 py-3 rounded-[14px] text-[13px] font-medium transition-all",
                !canNext || step === stepsCount - 1
                  ? "bg-slate-200 text-slate-500"
                  : "bg-slate-900 text-white hover:opacity-95",
              ].join(" ")}
            >
              {step === stepsCount - 1 ? "Done" : "Continue"}
            </button>
          </div>

          {!canNext && stepKey === "destination" ? (
            <div className="mt-3 text-[12px] text-rose-600">
              Please enter a country to continue.
            </div>
          ) : null}
        </>
      )}
    </PlannerShell>
  );
}
