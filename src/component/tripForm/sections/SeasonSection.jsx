import React from "react";
import { Calendar, Sun, Users, DollarSign } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, PillButton } from "../../../ui/primitives";

export default function SeasonSection({ tripStatus, value, onChange }) {
  const isPlanning = tripStatus === "planning";

  const togglePriority = (p) => {
    const curr = value.timingPriority || [];
    const next = curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p];
    onChange({ ...value, timingPriority: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<Calendar className="w-5 h-5" />}
        title={isPlanning ? "Travel Window" : "Confirmed Dates"}
        subtitle={isPlanning ? "When are you thinking of going?" : "Select your flight dates."}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label={isPlanning ? "Earliest Start" : "Start Date"}>
          <ControlShell className="bg-white">
            <input
              type={isPlanning ? "text" : "date"}
              value={value.start || ""}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              placeholder={isPlanning ? "e.g. June 2026" : ""}
              className="w-full bg-transparent outline-none text-sm text-slate-900"
            />
          </ControlShell>
        </Field>

        <Field label={isPlanning ? "Latest Start" : "End Date"}>
          <ControlShell className="bg-white">
            <input
              type={isPlanning ? "text" : "date"}
              value={value.end || ""}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              placeholder={isPlanning ? "e.g. August 2026" : ""}
              className="w-full bg-transparent outline-none text-sm text-slate-900"
            />
          </ControlShell>
        </Field>
      </div>

      {isPlanning ? (
        <>
          <Field label="Approximate Duration (Days)">
            <div className="mb-6">
              <input
                type="range"
                min="3"
                max="30"
                value={Number(value.durationDays || 7)}
                onChange={(e) => onChange({ ...value, durationDays: Number(e.target.value) })}
                className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right text-sm font-semibold mt-1">
                {Number(value.durationDays || 7)} Days
              </div>
            </div>
          </Field>

          <div className="mb-2 text-sm font-semibold text-slate-900">What matters for timing?</div>
          <div className="flex flex-wrap gap-2">
            <PillButton active={value.timingPriority?.includes("weather")} onClick={() => togglePriority("weather")}>
              <Sun className="w-4 h-4 inline mr-2" /> Best Weather
            </PillButton>

            <PillButton active={value.timingPriority?.includes("crowds")} onClick={() => togglePriority("crowds")}>
              <Users className="w-4 h-4 inline mr-2" /> Avoid Crowds
            </PillButton>

            <PillButton active={value.timingPriority?.includes("price")} onClick={() => togglePriority("price")}>
              <DollarSign className="w-4 h-4 inline mr-2" /> Cheapest Price
            </PillButton>
          </div>
        </>
      ) : null}
    </Card>
  );
}
