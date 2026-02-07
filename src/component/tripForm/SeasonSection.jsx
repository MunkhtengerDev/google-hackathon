// src/sections/SeasonSection.jsx
import React, { useMemo, useState } from "react";
import { Calendar, Sun, Cloud, CloudSnow, Leaf } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, PillButton } from "../../ui/primitives";

const SEASONS = [
  { id: "spring", label: "🌸 Spring", months: "Mar–May", icon: Leaf },
  { id: "summer", label: "☀️ Summer", months: "Jun–Aug", icon: Sun },
  { id: "autumn", label: "🍂 Autumn", months: "Sep–Nov", icon: Cloud },
  { id: "winter", label: "❄️ Winter", months: "Dec–Feb", icon: CloudSnow },
  { id: "no_preference", label: "🌎 Any", months: "Flexible", icon: Calendar },
];

const FLEX = [
  "Best weather",
  "Avoid crowds",
  "Festivals",
  "Lowest prices",
  "Can shift dates",
  "Weekends only",
  "School holidays",
];

function fmt(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SeasonSection({ tripStatus, value, onChange }) {
  const [focus, setFocus] = useState(null);
  const isBooked = tripStatus === "booked";

  const duration = useMemo(() => {
    if (isBooked) {
      if (!value.start || !value.end) return null;
      const s = new Date(value.start);
      const e = new Date(value.end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
      const days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : null;
    }
    return value.durationDays ? Number(value.durationDays) : null;
  }, [isBooked, value.start, value.end, value.durationDays]);

  const toggleFlex = (opt) => {
    const curr = value.flexibility || [];
    const next = curr.includes(opt) ? curr.filter((x) => x !== opt) : [...curr, opt];
    onChange({ ...value, flexibility: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<Calendar className="w-5 h-5" />}
        title="Travel timing"
        subtitle={isBooked ? "Enter your confirmed dates." : "Tell us your preferred timing."}
        right={
          duration ? (
            <div className="text-right">
              <div className="text-[12px] text-slate-500">Duration</div>
              <div className="text-[18px] font-semibold text-slate-900">{duration} days</div>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label={isBooked ? "Start date" : "Preferred start"} hint={isBooked ? "" : "e.g., April 2026"}>
          <ControlShell focused={focus === "start"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-[18px]">📅</div>
              <input
                type={isBooked ? "date" : "text"}
                value={value.start || ""}
                onChange={(e) => onChange({ ...value, start: e.target.value })}
                onFocus={() => setFocus("start")}
                onBlur={() => setFocus(null)}
                placeholder={isBooked ? "" : "April 2026"}
                className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
            {!isBooked && value.start ? <div className="mt-2 text-[12px] text-slate-500">Selected: {value.start}</div> : null}
          </ControlShell>
        </Field>

        <Field label={isBooked ? "End date" : "Trip length (days)"} hint={isBooked ? "" : "Recommended: 7–14"}>
          <ControlShell focused={focus === "end"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-[18px]">⏱️</div>
              {isBooked ? (
                <input
                  type="date"
                  value={value.end || ""}
                  onChange={(e) => onChange({ ...value, end: e.target.value })}
                  onFocus={() => setFocus("end")}
                  onBlur={() => setFocus(null)}
                  className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900"
                />
              ) : (
                <input
                  type="number"
                  min="1"
                  value={value.durationDays || ""}
                  onChange={(e) => onChange({ ...value, durationDays: Number(e.target.value) || 0 })}
                  onFocus={() => setFocus("end")}
                  onBlur={() => setFocus(null)}
                  placeholder="7"
                  className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
                />
              )}
            </div>
            {isBooked && value.start && value.end ? (
              <div className="mt-2 text-[12px] text-slate-500">
                {fmt(value.start)} → {fmt(value.end)}
              </div>
            ) : null}
          </ControlShell>
        </Field>
      </div>

      <div className="mb-6">
        <div className="text-[13px] font-semibold text-slate-900">Season preference</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <PillButton
              key={s.id}
              active={value.seasonPref === s.id}
              onClick={() => onChange({ ...value, seasonPref: s.id })}
            >
              {s.label} <span className="ml-2 text-white/80">{value.seasonPref === s.id ? "" : ""}</span>
            </PillButton>
          ))}
        </div>
        <div className="mt-2 text-[12px] text-slate-500">
          {SEASONS.find((x) => x.id === value.seasonPref)?.months || "Choose a season (optional)."}
        </div>
      </div>

      <div>
        <div className="text-[13px] font-semibold text-slate-900">What matters most?</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLEX.map((opt) => (
            <PillButton key={opt} active={(value.flexibility || []).includes(opt)} onClick={() => toggleFlex(opt)}>
              {opt}
            </PillButton>
          ))}
        </div>
      </div>
    </Card>
  );
}
