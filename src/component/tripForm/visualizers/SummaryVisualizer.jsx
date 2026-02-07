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
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-200">
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
              Trip Dashboard
            </span>
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${badge}`}>
            {data.tripStatus === "booked" ? "Confirmed Trip" : "Planning Phase"}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Your Trip Snapshot</h2>
        <div className="mt-2 text-[13px] text-slate-600">
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
                    <span key={x} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                      {x}
                    </span>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">Where to?</div>
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

      <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          Saved locally (LocalStorage). Your data won’t disappear on refresh.
        </p>
      </div>
    </div>
  );
}

function Row({ icon, title, ok, text, sub, custom }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`mt-1 p-2 rounded-lg ${ok ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
          {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <CircleDashed className="w-4 h-4 text-slate-300" />}
        </div>
        {custom ? custom : (
          <div className={`text-sm font-medium mt-1 ${ok ? "text-slate-900" : "text-slate-400 italic"}`}>
            {text}
          </div>
        )}
        {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
      </div>
    </div>
  );
}
