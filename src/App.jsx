import React, { useEffect, useState } from "react";
import "./App.css";
import SignInPage from "./component/auth/SignInPage";
import TripOnboarding from "./component/tripForm/TripOnboarding";
import TripResponsePage from "./component/responsePlan/TripResponsePage";
import { clearAuth, loadAuth, saveAuth } from "./lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");

function createDefaultPlannerData() {
  return {
    tripStatus: "",
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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  const cleaned = value.map((item) => normalizeText(item)).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function hydratePlannerData(preferences) {
  const base = createDefaultPlannerData();
  const questionnaire = preferences?.questionnaire || {};

  return {
    ...base,
    tripStatus: normalizeText(questionnaire.tripStatus),
    context: {
      ...base.context,
      homeCountry: normalizeText(questionnaire.context?.homeCountry),
      departureCity: normalizeText(questionnaire.context?.departureCity),
      currency:
        normalizeText(questionnaire.context?.currency) || base.context.currency,
      nearbyAirports: normalizeBoolean(
        questionnaire.context?.nearbyAirports,
        base.context.nearbyAirports
      ),
      departureAirportCode: normalizeText(
        questionnaire.context?.departureAirportCode
      ),
    },
    destination: {
      ...base.destination,
      countries: normalizeArray(questionnaire.destination?.countries),
      cities: normalizeArray(questionnaire.destination?.cities),
      regions: normalizeArray(questionnaire.destination?.regions),
      continents: normalizeArray(questionnaire.destination?.continents),
      flexibility:
        normalizeText(questionnaire.destination?.flexibility) ||
        base.destination.flexibility,
      dayTripsPlanned: normalizeBoolean(
        questionnaire.destination?.dayTripsPlanned,
        base.destination.dayTripsPlanned
      ),
    },
    dates: {
      ...base.dates,
      start: normalizeText(questionnaire.dates?.start),
      end: normalizeText(questionnaire.dates?.end),
      earliestStart: normalizeText(questionnaire.dates?.earliestStart),
      latestStart: normalizeText(questionnaire.dates?.latestStart),
      durationDays: normalizeNumber(
        questionnaire.dates?.durationDays,
        base.dates.durationDays
      ),
      durationRange: {
        min: normalizeText(questionnaire.dates?.durationRange?.min),
        max: normalizeText(questionnaire.dates?.durationRange?.max),
      },
      canChangeDates:
        normalizeText(questionnaire.dates?.canChangeDates) ||
        base.dates.canChangeDates,
      timingPriority: normalizeArray(questionnaire.dates?.timingPriority),
      seasonPref:
        normalizeText(questionnaire.dates?.seasonPref) || base.dates.seasonPref,
    },
    budget: {
      ...base.budget,
      currency:
        normalizeText(questionnaire.budget?.currency) || base.budget.currency,
      usdBudget: normalizeNumber(questionnaire.budget?.usdBudget, 0),
      budgetType:
        normalizeText(questionnaire.budget?.budgetType) ||
        base.budget.budgetType,
      savedAmountUsd: normalizeNumber(questionnaire.budget?.savedAmountUsd, 0),
      isFlexible: normalizeBoolean(
        questionnaire.budget?.isFlexible,
        base.budget.isFlexible
      ),
      priority:
        normalizeText(questionnaire.budget?.priority) || base.budget.priority,
      spendingStyle:
        normalizeText(questionnaire.budget?.spendingStyle) ||
        base.budget.spendingStyle,
      emergencyBufferUsd: normalizeNumber(
        questionnaire.budget?.emergencyBufferUsd,
        0
      ),
    },
    food: {
      ...base.food,
      diet: normalizeArray(questionnaire.food?.diet),
      importance:
        normalizeText(questionnaire.food?.importance) || base.food.importance,
      notes: normalizeText(questionnaire.food?.notes),
    },
    mobility: {
      ...base.mobility,
      preferredTransport: normalizeArray(questionnaire.mobility?.preferredTransport),
      comfortRange:
        normalizeText(questionnaire.mobility?.comfortRange) ||
        base.mobility.comfortRange,
      notes: normalizeText(questionnaire.mobility?.notes),
    },
    style: {
      ...base.style,
      interests: normalizeArray(questionnaire.style?.interests),
      tasteText: normalizeText(questionnaire.style?.tasteText),
      travelPace:
        normalizeText(questionnaire.style?.travelPace) || base.style.travelPace,
      hates: normalizeArray(questionnaire.style?.hates),
      pastLoved: normalizeArray(questionnaire.style?.pastLoved),
    },
    group: {
      ...base.group,
      who: normalizeText(questionnaire.group?.who) || base.group.who,
      adults: normalizeNumber(questionnaire.group?.adults, base.group.adults),
      childrenAges: Array.isArray(questionnaire.group?.childrenAges)
        ? questionnaire.group.childrenAges
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
        : base.group.childrenAges,
      totalPeople: normalizeNumber(
        questionnaire.group?.totalPeople,
        base.group.totalPeople
      ),
    },
    accommodation: {
      ...base.accommodation,
      status:
        normalizeText(questionnaire.accommodation?.status) ||
        base.accommodation.status,
      type: normalizeText(questionnaire.accommodation?.type),
      preference: normalizeArray(questionnaire.accommodation?.preference),
    },
    goals: {
      ...base.goals,
      experienceGoals: normalizeArray(questionnaire.goals?.experienceGoals),
      oneSentenceGoal: normalizeText(questionnaire.goals?.oneSentenceGoal),
    },
    permissions: {
      ...base.permissions,
      allowAltDestinations: normalizeBoolean(
        questionnaire.permissions?.allowAltDestinations,
        base.permissions.allowAltDestinations
      ),
      allowBudgetOptimize: normalizeBoolean(
        questionnaire.permissions?.allowBudgetOptimize,
        base.permissions.allowBudgetOptimize
      ),
      allowDailyAdjust: normalizeBoolean(
        questionnaire.permissions?.allowDailyAdjust,
        base.permissions.allowDailyAdjust
      ),
      allowSaveForFuture: normalizeBoolean(
        questionnaire.permissions?.allowSaveForFuture,
        base.permissions.allowSaveForFuture
      ),
    },
  };
}

function isPlannerComplete(data) {
  if (!data?.tripStatus) return false;
  if (
    !data.context?.homeCountry?.trim() ||
    !data.context?.departureCity?.trim()
  ) {
    return false;
  }

  const destinationCount =
    (data.destination?.countries?.length || 0) +
    (data.destination?.cities?.length || 0) +
    (data.destination?.regions?.length || 0);

  if (destinationCount <= 0) return false;

  const hasDates =
    data.tripStatus === "booked"
      ? Boolean(data.dates?.start) && Boolean(data.dates?.end)
      : Boolean(data.dates?.start);

  if (!hasDates) return false;

  const hasBudget =
    Number(data.budget?.usdBudget || 0) > 0 &&
    Boolean(data.budget?.currency?.trim());
  if (!hasBudget) return false;

  const hasFood = Boolean(data.food?.importance);
  const hasMobility = (data.mobility?.preferredTransport?.length || 0) > 0;
  const hasStyle = true;
  const hasPermissions = true;
  if (!hasFood || !hasMobility || !hasStyle || !hasPermissions) return false;

  if (data.tripStatus === "booked") {
    const hasGroup = Boolean(data.group?.who?.trim());
    const hasAccommodation = Boolean(data.accommodation?.status?.trim());
    const hasGoals =
      (data.goals?.experienceGoals?.length || 0) > 0 ||
      Boolean(data.goals?.oneSentenceGoal?.trim());

    if (!hasGroup || !hasAccommodation || !hasGoals) return false;
  }

  return true;
}

function App() {
  const [auth, setAuth] = useState(() => loadAuth());
  const [screen, setScreen] = useState("trip-response");
  const [plannerInitialData, setPlannerInitialData] = useState(() =>
    createDefaultPlannerData()
  );
  const [isHydratingPreferences, setIsHydratingPreferences] = useState(false);
  const [hydrateError, setHydrateError] = useState("");
  const [tripPlanResponse, setTripPlanResponse] = useState("");

  const handleSignInSuccess = (session) => {
    saveAuth(session);
    setAuth(session);
    setScreen("trip-response");
  };

  const handleSignOut = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    clearAuth();
    setAuth(null);
    setScreen("trip-response");
    setPlannerInitialData(createDefaultPlannerData());
    setHydrateError("");
    setIsHydratingPreferences(false);
    setTripPlanResponse("");
  };

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      if (!auth?.token) return;

      setIsHydratingPreferences(true);
      setHydrateError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            payload?.message || "Failed to load travel preferences"
          );
        }

        const hydratedData = hydratePlannerData(payload?.data || null);
        if (cancelled) return;

        setPlannerInitialData(hydratedData);
        setTripPlanResponse("");
        setScreen(isPlannerComplete(hydratedData) ? "trip-response" : "onboarding");
      } catch (error) {
        if (cancelled) return;
        setPlannerInitialData(createDefaultPlannerData());
        setScreen("onboarding");
        setHydrateError(
          error.message || "Could not load saved travel preferences"
        );
        setTripPlanResponse("");
      } finally {
        if (cancelled) return;
        setIsHydratingPreferences(false);
      }
    };

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [auth?.token]);

  if (!auth?.token) {
    return <SignInPage onSuccess={handleSignInSuccess} />;
  }

  if (isHydratingPreferences) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[760px] rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_28px_64px_rgba(15,23,42,0.12)]">
          <h1 className="font-display text-[42px] leading-[0.94] text-[var(--ink)]">
            Loading your travel plan...
          </h1>
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
            Checking saved preferences to decide whether to open Planner or AI
            page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none fixed right-4 top-4 z-50">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)]/96 px-2.5 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.10)] backdrop-blur">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0f706c] to-[#084744] text-[11px] font-bold text-white">
            {(auth.user?.email || "U").slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-[220px] truncate text-xs font-semibold text-[#4f616b]">
            {auth.user?.email || "Signed in"}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
          >
            Sign out
          </button>
        </div>
      </div>
      {hydrateError ? (
        <div className="pointer-events-none fixed left-4 top-4 z-40 max-w-[460px] rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-2 text-xs font-medium text-[#8b3f2d] shadow-[0_12px_26px_rgba(120,40,28,0.14)]">
          {hydrateError}
        </div>
      ) : null}
      {screen === "onboarding" ? (
        <TripOnboarding
          token={auth.token}
          initialData={plannerInitialData}
          onCompleted={(result) => {
            if (result?.plannerData && typeof result.plannerData === "object") {
              setPlannerInitialData(result.plannerData);
            }
            if (typeof result?.tripPlan === "string") {
              setTripPlanResponse(result.tripPlan);
            }
            setScreen("trip-response");
          }}
        />
      ) : (
        <TripResponsePage
          token={auth.token}
          user={auth.user}
          initialTripPlan={tripPlanResponse}
          onBackToPlanner={() => setScreen("onboarding")}
        />
      )}
    </div>
  );
}

export default App;
