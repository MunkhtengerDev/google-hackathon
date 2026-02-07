import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { Card, SectionHeader } from "../../ui/primitives";

/**
 * Minimal markdown parser for your AI output:
 * - Splits by H2 (##) into sections
 * - Keeps content as plain text blocks
 * - Also extracts a quick "Budget Allocation" list if present
 */
function parseMarkdownSections(md = "") {
  const text = String(md || "").trim();
  if (!text) return [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, "\n");

  // Split by "## "
  const parts = normalized.split(/\n(?=##\s+)/g);

  // If the response doesn't contain "##", treat as one section
  if (parts.length === 1 && !/^##\s+/.test(parts[0])) {
    return [{ title: "AI Response", content: normalized }];
  }

  const sections = parts
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const first = lines[0] || "";
      const title = first.replace(/^##\s+/, "").trim() || "Untitled";
      const content = lines.slice(1).join("\n").trim();
      return { title, content };
    });

  return sections;
}

/** Extract budget lines like "* Flights: $1500" from a "Budget Allocation" section */
function extractBudgetItems(sections) {
  const target = sections.find((s) =>
    /budget allocation/i.test(s.title || "")
  );
  if (!target?.content) return [];

  const lines = target.content.split("\n").map((l) => l.trim());
  const items = [];
  for (const line of lines) {
    // match "- **Flights ...:** $1500" or "* Flights ...: $1500"
    const cleaned = line
      .replace(/^[*\-]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();

    const m = cleaned.match(/^(.+?):\s*(.+)$/);
    if (m) {
      items.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  return items;
}

/** Simple “day-by-day” extractor (looks for "Day 1:", "Day 2:" etc.) */
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
    if (m) {
      days.push({ day: Number(m[1]), text: m[2].trim() });
    }
  }
  return days;
}

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
                  active ? "bg-white/15 text-white" : "bg-[#ffe6bf] text-[#6a4a12]",
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

/**
 * Main dashboard component
 * - Pass your AI response string (tripPlanText or resultText)
 */
export default function ResponsePlan({
  title = "Trip Dashboard",
  subtitle = "Switch views from the sidebar to explore your plan.",
  responseText = "",
  smartPlanCount = 5, // 3 / 5 / 7
  onRefresh,
  rightNowContext,
}) {
  const [active, setActive] = useState("smart");

  const sections = useMemo(
    () => parseMarkdownSections(responseText),
    [responseText]
  );

  const days = useMemo(() => extractDays(sections), [sections]);
  const budgetItems = useMemo(() => extractBudgetItems(sections), [sections]);

  // "Smart plans": we generate options by slicing itinerary days into variants
  const smartPlans = useMemo(() => {
    const count = [3, 5, 7].includes(smartPlanCount) ? smartPlanCount : 5;
    const base = days.length ? days : [{ day: 1, text: "No itinerary parsed yet." }];

    // Create simple variants by shifting emphasis (early/mid/late)
    const variants = [];
    for (let i = 0; i < count; i++) {
      const offset = i % 3; // 0/1/2
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

  const canShow = Boolean(String(responseText || "").trim());

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
            <Pill icon={<MapPin className="h-3.5 w-3.5" />} text="Location-aware" />
            <Pill icon={<Clock className="h-3.5 w-3.5" />} text="Time logic" />
          </div>
        </Card>
      </aside>

      {/* Main content */}
      <section className="lg:col-span-9">
        {!canShow ? (
          <EmptyState
            title="No AI response yet"
            subtitle="Generate a plan (or send a prompt) and the dashboard will turn it into an interactive view."
          />
        ) : (
          <div className="space-y-6">
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
                    onClick={() => navigator.clipboard?.writeText(responseText)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([responseText], { type: "text/plain;charset=utf-8" });
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
                  subtitle={`Generated options (${smartPlanCount}) you can pick and refine.`}
                  right={
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#6a7b84]">
                        Options:
                      </span>
                      <select
                        value={smartPlanCount}
                        onChange={(e) => {
                          // parent controls recommended; local fallback:
                          // eslint-disable-next-line no-alert
                          alert("Tip: control smartPlanCount from parent. This is UI-only.");
                        }}
                        className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]"
                      >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                      </select>
                    </div>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {smartPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-[18px] border border-[#e8dcc8] bg-[#fffaf1] p-4"
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
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d6a66] to-[#084744] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_12px_26px_rgba(12,95,92,0.22)] transition hover:brightness-105"
                        >
                          Select
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
                        {!days.length ? (
                          <div className="text-[12px] text-[#6a7b84]">
                            Couldn’t parse “Day X” lines yet. Still showing the response in other tabs.
                          </div>
                        ) : null}
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
                  subtitle="Map + time logic (plug your Google Maps component here)."
                  right={
                    <div className="flex items-center gap-2 rounded-full border border-[#e8dcc8] bg-[#fffaf1] px-3 py-1.5 text-[11px] font-bold text-[#6a4a12]">
                      <Search className="h-3.5 w-3.5" />
                      Route builder
                    </div>
                  }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  {/* Map panel placeholder */}
                  <div className="lg:col-span-7">
                    <div className="h-[360px] overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Map Panel
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Replace this box with your Google Maps component (DirectionsService + DirectionsRenderer).
                      </div>
                      <div className="mt-4 grid h-[270px] place-items-center rounded-[18px] border border-dashed border-[#e0d3be] bg-white text-[12px] text-[#6a7b84]">
                        Google Maps goes here
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Route Timeline
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Pull stops from itinerary sections (museums, hotels, etc.)
                      </div>

                      <div className="mt-4 space-y-2">
                        {days.slice(0, 8).map((d) => (
                          <div
                            key={`route_${d.day}`}
                            className="flex items-start gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#2f4954]">
                              Day {d.day}
                            </div>
                            <div className="text-[12px] leading-relaxed text-[#2f4954]">
                              {d.text}
                            </div>
                          </div>
                        ))}
                        {!days.length ? (
                          <div className="text-[12px] text-[#6a7b84]">
                            No “Day X” items found yet. Still fine—map can also run from user-selected places.
                          </div>
                        ) : null}
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
                  subtitle="Budget breakdown + currency (connect to your currency conversion logic)."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-white">
                      <div className="border-b border-[#eee3d2] bg-[#fffaf1] px-4 py-3">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          Budget Allocation
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                          Parsed from “Budget Allocation” section.
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
                            Couldn’t parse “Budget Allocation” yet. Keep the raw section available in “All Sections”.
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
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Add currency conversion, spend tracking, and alerts.
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
                  subtitle="Integrate Google Drive / Photos. Save itinerary + images per day."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Trip Album (Placeholder)
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Show uploaded photos, AI captions, and day tags.
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={`mem_${i}`}
                            className="aspect-square overflow-hidden rounded-[18px] border border-[#eadfcf] bg-white"
                          >
                            <div className="grid h-full place-items-center text-[12px] text-[#6a7b84]">
                              Photo {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Save & Organize
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Suggested structure (Drive folders):
                      </div>

                      <div className="mt-4 space-y-2">
                        {[
                          "Trip / Paris / Day-01",
                          "Trip / Paris / Day-02",
                          "Trip / Spain / Day-10",
                          "Trip / Receipts / Wallet",
                        ].map((t) => (
                          <div
                            key={t}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                          >
                            <div className="text-[12px] font-semibold text-[#2f4954]">
                              {t}
                            </div>
                            <button
                              type="button"
                              className="rounded-full border border-[#eadfcf] bg-white px-3 py-1.5 text-[11px] font-bold text-[#2f4954] hover:bg-[#fff8eb]"
                            >
                              Create
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {active === "rightnow" ? (
              <Card>
                <SectionHeader
                  icon={<Zap className="h-5 w-5" />}
                  title="Right Now"
                  subtitle="Real-time recommendations based on current location/time."
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        Quick Actions
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Ideal for “next 1–3 hours” prompts.
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          { t: "Find nearby art museums", i: <MapPin className="h-4 w-4" /> },
                          { t: "Best cafe within 15 min walk", i: <MapPin className="h-4 w-4" /> },
                          { t: "Sunset viewpoint + route", i: <Route className="h-4 w-4" /> },
                          { t: "Buy timed tickets now", i: <Clock className="h-4 w-4" /> },
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

                      {rightNowContext ? (
                        <div className="mt-4 rounded-[18px] border border-[#eadfcf] bg-white p-3 text-[12px] text-[#2f4954]">
                          <div className="font-bold">Context</div>
                          <div className="mt-1 text-[#6a7b84]">
                            {JSON.stringify(rightNowContext, null, 2)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
                      <div className="text-[12px] font-bold text-[#2f4954]">
                        AI Notes (Raw Sections)
                      </div>
                      <div className="mt-1 text-[12px] text-[#6a7b84]">
                        Keep the original plan accessible.
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
