import React from "react";
import { Compass, Calendar, Wallet, MapPin, Plane, CheckCircle2, CircleDashed } from "lucide-react";

export default function SummaryVisualizer({ data }) {
  const hasOrigin = !!(data.context?.homeCountry || data.context?.departureCity);
  const hasDest =
    (data.destination?.countries?.length || 0) +
      (data.destination?.cities?.length || 0) +
      (data.destination?.regions?.length || 0) >
    0;
  const hasDates = !!data.dates?.start;
  const hasBudget = Number(data.budget?.usdBudget || 0) > 0;

  const badge = data.tripStatus === "booked"
    ? "bg-[#e7f6ef] text-[#24634f] border-[#bde4d3]"
    : "bg-[#fff1db] text-[#8a5a2f] border-[#f0cf9f]";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#dfd3bf] bg-white shadow-[0_8px_26px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#e4d8c4] bg-[#f9f2e5] p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#0c5f5c]" />
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0c5f5c]">
              Trip Dashboard
            </span>
          </div>
          <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide border ${badge}`}>
            {data.tripStatus === "booked" ? "Confirmed Trip" : "Planning Phase"}
          </span>
        </div>

        <h2 className="font-display text-[34px] leading-[1] text-[var(--ink)]">Trip Snapshot</h2>
        <div className="mt-2 text-[13px] text-[#556972]">
          We’ll use your answers to generate itinerary, logistics, and budget strategy.
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Origin */}
        <Row
          icon={<Plane className="w-4 h-4" />}
          title="Origin"
          ok={hasOrigin}
          text={
            hasOrigin
              ? `${data.context?.departureCity || "City"}, ${data.context?.homeCountry || "Country"}`
              : "Not set yet"
          }
          sub={data.context?.currency ? `Currency: ${data.context.currency}` : ""}
        />

        {/* Destination */}
        <Row
          icon={<MapPin className="w-4 h-4" />}
          title="Destination"
          ok={hasDest}
          custom={
            hasDest ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {[...(data.destination.countries || []), ...(data.destination.cities || []), ...(data.destination.regions || [])]
                  .slice(0, 10)
                  .map((x) => (
                    <span key={x} className="rounded-md border border-[#dacdb9] bg-[#fff8eb] px-2 py-1 text-xs font-medium text-[#3f5660]">
                      {x}
                    </span>
                  ))}
              </div>
            ) : (
              <div className="text-sm italic text-slate-400">Where to?</div>
            )
          }
        />

        {/* Dates */}
        <Row
          icon={<Calendar className="w-4 h-4" />}
          title="Timing"
          ok={hasDates}
          text={hasDates ? `${data.dates.start} → ${data.dates.end || "?"}` : "No dates selected"}
          sub={data.tripStatus === "planning" ? `Duration: ~${data.dates?.durationDays || 7} days` : ""}
        />

        {/* Budget */}
        <Row
          icon={<Wallet className="w-4 h-4" />}
          title="Budget"
          ok={hasBudget}
          text={hasBudget ? `$${Number(data.budget.usdBudget).toLocaleString()} USD` : "Not set"}
          sub={data.budget?.priority ? `Priority: ${data.budget.priority}` : ""}
        />
      </div>

      <div className="border-t border-[#e4d8c4] bg-[#f9f2e5] p-4 text-center">
        <p className="text-xs text-[#5d7079]">
          Saved locally (LocalStorage). Your data won’t disappear on refresh.
        </p>
      </div>
    </div>
  );
}

function Row({ icon, title, ok, text, sub, custom }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-1 rounded-lg p-2 ${ok ? "bg-[#e8f7f4] text-[#0c5f5c]" : "bg-slate-100 text-slate-400"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#5d7078]">{title}</div>
          {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CircleDashed className="w-4 h-4 text-slate-300" />}
        </div>
        {custom ? custom : (
          <div className={`mt-1 text-sm font-medium ${ok ? "text-[var(--ink)]" : "text-slate-400 italic"}`}>
            {text}
          </div>
        )}
        {sub ? <div className="mt-1 text-xs text-[#61747d]">{sub}</div> : null}
      </div>
    </div>
  );
}
