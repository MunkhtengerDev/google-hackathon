import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Brain,
  Route,
  Wallet,
  Camera,
  Zap,
  RefreshCcw,
  Copy,
  Download,
  Search,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, SectionHeader } from "../../ui/primitives";
import LiveResponseRenderer from "../ai/LiveResponseRenderer";

// --- Helpers ---

function formatTimestamp(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function parseMarkdownSections(md = "") {
  const text = String(md || "").trim();
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n");
  const parts = normalized.split(/\n(?=##\s+)/g);
  if (parts.length === 1 && !/^##\s+/.test(parts[0])) {
    return [{ title: "AI Response", content: normalized }];
  }
  return parts
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const title = lines[0].replace(/^##\s+/, "").trim() || "Untitled";
      const content = lines.slice(1).join("\n").trim();
      return { title, content };
    });
}

function extractBudgetItems(sections) {
  const target = sections.find((s) => /budget allocation/i.test(s.title || ""));
  if (!target?.content) return [];
  const lines = target.content.split("\n").map((l) => l.trim());
  const items = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[*\-]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    const m = cleaned.match(/^(.+?):\s*(.+)$/);
    if (m) items.push({ label: m[1].trim(), value: m[2].trim() });
  }
  return items;
}

function extractDays(sections) {
  const target = sections.find((s) =>
    /(day-by-day|itinerary)/i.test(s.title || "")
  );
  if (!target?.content) return [];
  const lines = target.content.split("\n");
  const days = [];
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^(?:[*\-]\s*)?\*\*?Day\s+(\d+)\s*\*?\*?:\s*(.+)$/i);
    if (m) days.push({ day: Number(m[1]), text: m[2].trim() });
  }
  return days;
}

// --- Internal Components ---

function NavItem({ active, icon, label, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-2xl px-3.5 py-3 text-left transition",
        active
          ? "bg-[#0b5b57] text-white shadow-[0_14px_30px_rgba(11,91,87,0.20)]"
          : "bg-transparent text-[#2f4954] hover:bg-[#fff3df]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "grid h-9 w-9 place-items-center rounded-xl border transition",
            active
              ? "border-white/20 bg-white/10"
              : "border-[#e8dcc8] bg-[#fffaf1] group-hover:bg-white",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-[13px] font-semibold">{label}</div>
            {badge ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-[#ffe6bf] text-[#6a4a12]",
                ].join(" ")}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <div
            className={[
              "mt-0.5 flex items-center gap-1 text-[11px]",
              active ? "text-white/75" : "text-[#74878f]",
            ].join(" ")}
          >
            <ChevronRight className="h-3 w-3" />
            View details
          </div>
        </div>
      </div>
    </button>
  );
}

function Pill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d7c3] bg-[#fffaf1] px-3 py-1.5 text-[12px] font-semibold text-[#2f4954]">
      {icon}
      {text}
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
      <div className="max-w-md">
        <div className="text-[14px] font-bold text-[#2f4954]">{title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-[#6a7b84]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// --- UPDATED MAP COMPONENT ---
function LiveRouteMap({ items = [] }) {
  const mapRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. Load Google Maps Script & Handle Auth Errors
  useEffect(() => {
    // Handle the specific "Invalid Key" error from Google
    window.gm_authFailure = () => {
      console.error("Google Maps Authentication Failed. Check your API Key.");
      setError("Map unavailable: API Key invalid or billing disabled.");
      setIsLoading(false);
    };

    if (!apiKey) {
      setError("Missing VITE_GOOGLE_MAPS_API_KEY in .env file");
      setIsLoading(false);
      return;
    }

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.onload = () => {
        // Script loaded, waiting for map init
      };
      script.onerror = () => {
        setIsLoading(false);
        setError("Failed to load Google Maps script (Network error).");
      };
      document.head.appendChild(script);
    } else {
      // API already loaded
      setIsLoading(false);
    }
  }, [apiKey]);

  // 2. Initialize Map
  useEffect(() => {
    if (isLoading || error || !mapRef.current || mapObj || !window.google) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
          },
        ],
      });
      setMapObj(mapInstance);
      setIsLoading(false);
    } catch (e) {
      console.error("Map Init Error:", e);
      setError("Error initializing map.");
      setIsLoading(false);
    }
  }, [isLoading, error, mapObj]);

  // 3. Calculate Route
  useEffect(() => {
    if (!mapObj || !items.length || !window.google || error) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapObj,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#0b5b57",
        strokeWeight: 4,
      },
    });

    const originText = items[0]?.text || "";
    const destText = items[items.length - 1]?.text || "";

    // Need at least Origin + Destination to route
    if (originText && destText && items.length > 1) {
      // Gather waypoints (items between first and last)
      const waypoints = items.slice(1, -1).map((item) => ({
        location: item.text,
        stopover: true,
      }));

      directionsService.route(
        {
          origin: originText,
          destination: destText,
          waypoints: waypoints.slice(0, 10), // Limit to 10 waypoints (free tier limit)
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
            directionsRenderer.setDirections(result);
          } else {
            console.warn("Routing failed:", status);
            // Don't set global error, just log it. The map will still show, just no line.
          }
        }
      );
    }

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [mapObj, items, error]);

  // --- RENDER STATES ---

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] bg-[#f8f5f2] p-6 text-center">
        <div className="mb-2 rounded-full bg-[#fee2e2] p-3 text-red-500">
          <Sparkles className="h-6 w-6" /> 
        </div>
        <div className="text-[13px] font-bold text-[#7f1d1d]">Map Unavailable</div>
        <div className="mt-1 max-w-[200px] text-[12px] text-[#991b1b]">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-[#e5e7eb]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader2 className="h-6 w-6 animate-spin text-[#0b5b57]" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function ResponsePlan({
  title = "Trip Dashboard",
  subtitle = "Switch views from the sidebar to explore your plan.",
  responseText = "",
  planResponseText = "",
  liveResponseText = "",
  isLoading = false,
  loadError = "",
  lastPlanAt = "",
  lastLiveAt = "",
  onRefresh,
  rightNowContext,
}) {
  const [active, setActive] = useState("smart");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const smartPlanCount = 3;
  const sourcePlanText = String(planResponseText || responseText || "");
  const sourceLiveText = String(liveResponseText || "");

  const sections = useMemo(
    () => parseMarkdownSections(sourcePlanText),
    [sourcePlanText]
  );

  const days = useMemo(() => extractDays(sections), [sections]);
  const budgetItems = useMemo(() => extractBudgetItems(sections), [sections]);

  const smartPlans = useMemo(() => {
    const count = smartPlanCount;
    const base = days.length
      ? days
      : [{ day: 1, text: "No itinerary parsed yet." }];

    const variants = [];
    for (let i = 0; i < count; i++) {
      const offset = i % 3;
      const chunk = base.slice(offset, offset + Math.min(10, base.length));
      variants.push({
        id: `plan_${i}`,
        name: `Option ${i + 1}`,
        highlight:
          offset === 0
            ? "Classic pace • balanced"
            : offset === 1
            ? "Faster pace • more sights"
            : "Slower pace • more comfort",
        items: chunk,
      });
    }
    return variants;
  }, [days, smartPlanCount]);

  useEffect(() => {
    if (!smartPlans.length) {
      setSelectedPlanId("");
      return;
    }
    if (!smartPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(smartPlans[0].id);
    }
  }, [smartPlans, selectedPlanId]);

  const selectedPlan =
    smartPlans.find((plan) => plan.id === selectedPlanId) ||
    smartPlans[0] ||
    null;

  const canShow = Boolean(sourcePlanText.trim());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Sidebar */}
      <aside className="lg:col-span-3">
        <Card className="sticky top-6">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" />}
            title={title}
            subtitle={subtitle}
            right={
              onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              ) : null
            }
          />

          <div className="space-y-2">
            <NavItem
              active={active === "smart"}
              onClick={() => setActive("smart")}
              label="🧠 Smart Plans"
              badge={`${smartPlanCount}`}
              icon={<Brain className="h-4 w-4" />}
            />
            <NavItem
              active={active === "route"}
              onClick={() => setActive("route")}
              label="🗺️ Live Route"
              icon={<Route className="h-4 w-4" />}
            />
            <NavItem
              active={active === "wallet"}
              onClick={() => setActive("wallet")}
              label="💰 Wallet"
              icon={<Wallet className="h-4 w-4" />}
            />
            <NavItem
              active={active === "memories"}
              onClick={() => setActive("memories")}
              label="📸 Memories"
              icon={<Camera className="h-4 w-4" />}
            />
            <NavItem
              active={active === "rightnow"}
              onClick={() => setActive("rightnow")}
              label="⚡ Right Now"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill
              icon={<MapPin className="h-3.5 w-3.5" />}
              text="Location-aware"
            />
            <Pill icon={<Clock className="h-3.5 w-3.5" />} text="Time logic" />
          </div>
          <div className="mt-3 rounded-2xl border border-[#eadfcf] bg-[#fffaf1] px-3 py-2 text-[11px] text-[#5d727c]">
            <div>Plan updated: {formatTimestamp(lastPlanAt)}</div>
            <div className="mt-1">
              Live updated: {formatTimestamp(lastLiveAt)}
            </div>
          </div>
        </Card>
      </aside>

      {/* Main content */}
      <section className="lg:col-span-9">
        {isLoading ? (
          <EmptyState
            title="Loading trip dashboard..."
            subtitle="Fetching your latest saved trip plan and live response."
          />
        ) : !canShow ? (
          <EmptyState
            title="No AI response yet"
            subtitle="Generate a plan (or send a prompt) and the dashboard will turn it into an interactive view."
          />
        ) : (
          <div className="space-y-6">
            {loadError ? (
              <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
                {loadError}
              </div>
            ) : null}
            {/* Header row actions */}
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#2f4954]">
                    Interactive Response View
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                    Parsed from your AI text (sections, itinerary, and budget).
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      sourcePlanText.trim()
                        ? navigator.clipboard?.writeText(sourcePlanText)
                        : null
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([sourcePlanText], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "trip-plan.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff8eb] px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#ffeecd]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              </div>
            </Card>

            {active === "smart" ? (
              <Card>
                <SectionHeader
                  icon={<Brain className="h-5 w-5" />}
                  title="Smart Plans"
                  subtitle="Generated options (3) you can pick and refine."
                  right={
                    <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                      Options: 3
                    </div>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {smartPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={[
                        "rounded-[18px] border bg-[#fffaf1] p-4 transition",
                        selectedPlan?.id === plan.id
                          ? "border-[#0d6a66] shadow-[0_12px_26px_rgba(12,95,92,0.16)]"
                          : "border-[#e8dcc8]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[13px] font-bold text-[#2f4954]">
                            {plan.name}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                            {plan.highlight}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setActive("route");
                          }}
                          className={[
                            "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                            selectedPlan?.id === plan.id
                              ? "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_12px_26px_rgba(12,95,92,0.22)]"
                              : "border border-[var(--line)] bg-white text-[#2f4954] hover:border-[var(--line-strong)] hover:bg-[#fff8eb]",
                          ].join(" ")}
                        >
                          {selectedPlan?.id === plan.id ? "Selected" : "Select"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {plan.items.slice(0, 6).map((d) => (
                          <div
                            key={`${plan.id}_${d.day}`}
                            className="flex items-start gap-3 rounded-2xl border border-[#eadfcf] bg-white px-3 py-2"
                          >
                            <div className="mt-0.5 rounded-full bg-[#fff3df] px-2 py-0.5 text-[11px] font-bold text-[#6a4a12]">
                              Day {d.day}
                            </div>
                            <div className="text-[12px] leading-relaxed text-[#2f4954]">
                              {d.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {active === "route" ? (
              <Card>
                <SectionHeader
                  icon={<Route className="h-5 w-5" />}
                  title="Live Route"
                  subtitle={
                    selectedPlan
                      ? `Showing ${selectedPlan.name} • ${selectedPlan.highlight}`
                      : "Select a smart plan to populate this route."
                  }
                  right={
                    <div className="flex items-center gap-2 rounded-full border border-[#e8dcc8] bg-[#fffaf1] px-3 py-1.5 text-[11px] font-bold text-[#6a4a12]">
                      <Search className="h-3.5 w-3.5" />
                      {selectedPlan ? selectedPlan.name : "Route builder"}
                    </div>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  {/* Map panel - NOW ACTIVE */}
                  <div className="lg:col-span-7">
                    <div className="h-[400px] overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-1 shadow-inner">
                      {selectedPlan?.items?.length ? (
                        <LiveRouteMap items={selectedPlan.items} />
                      ) : (
                        <div className="grid h-full place-items-center text-[13px] text-[#6a7b84]">
                          Select a plan to visualize the route.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Route Timeline
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Uses the selected smart plan as the active route.
                      </div>

                      <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {(selectedPlan?.items || []).map((d) => (
                          <div
                            key={`route_${selectedPlan?.id || "none"}_${d.day}`}
                            className="flex items-start gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#2f4954]">
                              Day {d.day}
                            </div>
                            <div className="text-[12px] leading-relaxed text-[#2f4954]">
                              {d.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === "wallet" ? (
              <Card>
                <SectionHeader
                  icon={<Wallet className="h-5 w-5" />}
                  title="Wallet"
                  subtitle="Budget breakdown + currency."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-white">
                      <div className="border-b border-[#eee3d2] bg-[#fffaf1] px-4 py-3">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          Budget Allocation
                        </div>
                      </div>

                      <div className="p-4">
                        {budgetItems.length ? (
                          <div className="space-y-2">
                            {budgetItems.map((b, idx) => (
                              <div
                                key={`${b.label}_${idx}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                              >
                                <div className="text-[12px] font-semibold text-[#2f4954]">
                                  {b.label}
                                </div>
                                <div className="text-[12px] font-bold text-[#0b5b57]">
                                  {b.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[12px] text-[#6a7b84]">
                            Couldn’t parse “Budget Allocation” yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Wallet Tools
                      </div>
                      <div className="mt-4 space-y-2">
                        {[
                          "Convert home currency → destination currency",
                          "Daily spending limit suggestions",
                          "Track hotels / tickets / activities",
                          "Overspend risk alerts",
                        ].map((t) => (
                          <div
                            key={t}
                            className="rounded-2xl border border-[#eadfcf] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === "memories" ? (
              <Card>
                <SectionHeader
                  icon={<Camera className="h-5 w-5" />}
                  title="Memories"
                  subtitle="Integrate Google Drive / Photos."
                />
                <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4 text-center text-[#6a7b84] text-[13px]">
                  Memory features coming soon.
                </div>
              </Card>
            ) : null}

            {active === "rightnow" ? (
              <Card>
                <SectionHeader
                  icon={<Zap className="h-5 w-5" />}
                  title="Right Now"
                  subtitle="Real-time recommendations."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Quick Actions
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          {
                            t: "Find nearby art museums",
                            i: <MapPin className="h-4 w-4" />,
                          },
                          {
                            t: "Best cafe within 15 min walk",
                            i: <MapPin className="h-4 w-4" />,
                          },
                          {
                            t: "Sunset viewpoint + route",
                            i: <Route className="h-4 w-4" />,
                          },
                          {
                            t: "Buy timed tickets now",
                            i: <Clock className="h-4 w-4" />,
                          },
                        ].map((x) => (
                          <button
                            key={x.t}
                            type="button"
                            className="flex items-center justify-between gap-3 rounded-[18px] border border-[#eadfcf] bg-white px-4 py-3 text-left transition hover:bg-[#fff8eb]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#eadfcf] bg-[#fffaf1]">
                                {x.i}
                              </div>
                              <div className="text-[12px] font-bold text-[#2f4954]">
                                {x.t}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#6a7b84]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Raw AI Response
                      </div>
                      <div className="mt-4 space-y-2 max-h-[340px] overflow-auto pr-1">
                        {sections.map((s) => (
                          <details
                            key={s.title}
                            className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <summary className="cursor-pointer text-[12px] font-bold text-[#2f4954]">
                              {s.title}
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-[#2f4954]">
                              {s.content}
                            </pre>
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}