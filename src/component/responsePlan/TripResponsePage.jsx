import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Compass, Route } from "lucide-react";
import { Card, SectionHeader } from "../../ui/primitives";
import ResponsePlan from "./ResponsePlan";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");

export default function TripResponsePage({
  token,
  initialTripPlan = "",
  onBackToPlanner,
  onGoLiveResponse,
}) {
  const [planResponse, setPlanResponse] = useState(initialTripPlan || "");
  const [liveResponse, setLiveResponse] = useState("");
  const [lastPlanAt, setLastPlanAt] = useState(
    initialTripPlan?.trim() ? new Date().toISOString() : ""
  );
  const [lastLiveAt, setLastLiveAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadTripResponses = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setLoadError("");

    try {
      const dashboardResponse = await fetch(
        `${API_BASE_URL}/api/v1/trip-planning/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dashboardPayload = await dashboardResponse.json().catch(() => null);

      if (dashboardResponse.ok) {
        const planData = dashboardPayload?.data?.tripPlan || null;
        const liveData = dashboardPayload?.data?.liveTravel || null;

        setPlanResponse(
          typeof planData?.response === "string" ? planData.response : ""
        );
        setLiveResponse(
          typeof liveData?.response === "string" ? liveData.response : ""
        );
        setLastPlanAt(
          typeof planData?.createdAt === "string" ? planData.createdAt : ""
        );
        setLastLiveAt(
          typeof liveData?.createdAt === "string" ? liveData.createdAt : ""
        );
        return;
      }

      if (dashboardResponse.status === 404) {
        const latestResponse = await fetch(
          `${API_BASE_URL}/api/v1/trip-planning/latest`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const latestPayload = await latestResponse.json().catch(() => null);
        if (!latestResponse.ok && latestResponse.status !== 404) {
          throw new Error(
            latestPayload?.message || "Failed to load latest trip plan"
          );
        }

        setPlanResponse(
          typeof latestPayload?.data?.plan === "string"
            ? latestPayload.data.plan
            : ""
        );
        setLastPlanAt(
          typeof latestPayload?.data?.createdAt === "string"
            ? latestPayload.data.createdAt
            : ""
        );
        setLiveResponse("");
        setLastLiveAt("");
        setLoadError(
          "Dashboard API not available yet on this backend instance. Showing trip plan only."
        );
        return;
      }

      throw new Error(dashboardPayload?.message || "Failed to load trip dashboard");
    } catch (error) {
      setLoadError(error.message || "Unable to load trip responses");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (typeof initialTripPlan === "string" && initialTripPlan.trim()) {
      setPlanResponse(initialTripPlan);
      setLastPlanAt(new Date().toISOString());
    }
  }, [initialTripPlan]);

  useEffect(() => {
    loadTripResponses();
  }, [loadTripResponses]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1320px] space-y-6">
        <Card>
          <SectionHeader
            icon={<Compass className="h-5 w-5" />}
            title="Trip Response"
            subtitle="Dedicated dashboard for your saved trip-planning AI output."
            right={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onGoLiveResponse}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                >
                  <Route className="h-3.5 w-3.5" />
                  Live Travel AI
                </button>
                <button
                  type="button"
                  onClick={onBackToPlanner}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Planner
                </button>
              </div>
            }
          />
        </Card>

        <ResponsePlan
          title="Trip Dashboard"
          subtitle="Analyze your trip plan and latest live AI output in one dashboard."
          planResponseText={planResponse}
          liveResponseText={liveResponse}
          isLoading={isLoading}
          loadError={loadError}
          lastPlanAt={lastPlanAt}
          lastLiveAt={lastLiveAt}
          onRefresh={loadTripResponses}
        />
      </div>
    </main>
  );
}
