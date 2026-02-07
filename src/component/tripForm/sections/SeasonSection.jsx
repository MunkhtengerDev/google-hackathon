import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Sun, Users, DollarSign } from "lucide-react";
import {
  Card,
  SectionHeader,
  Field,
  ControlShell,
  PillButton,
} from "../../../ui/primitives";

export default function SeasonSection({ tripStatus, value, onChange }) {
  const isPlanning = tripStatus === "planning";

  const togglePriority = (p) => {
    const curr = value.timingPriority || [];
    const next = curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p];
    onChange({ ...value, timingPriority: next });
  };

  const handleStartChange = (date) => {
    onChange({ ...value, start: date ? date.toISOString() : null });
  };

  const handleEndChange = (date) => {
    onChange({ ...value, end: date ? date.toISOString() : null });
  };
  return (
    <Card>
      <SectionHeader
        icon={<Calendar className="w-5 h-5" />}
        title={isPlanning ? "Travel Window" : "Confirmed Dates"}
        subtitle={
          isPlanning
            ? "When are you thinking of going?"
            : "Select your flight dates."
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label={isPlanning ? "Earliest Start" : "Start Date"}>
          <ControlShell className="bg-white">
            <DatePicker
              selected={value.start ? new Date(value.start) : null}
              onChange={handleStartChange}
              selectsStart
              startDate={value.start ? new Date(value.start) : null}
              endDate={value.end ? new Date(value.end) : null}
              minDate={new Date()}
              placeholderText={
                isPlanning ? "Select earliest date" : "Select start date"
              }
              dateFormat={isPlanning ? "MMMM yyyy" : "MMM d, yyyy"}
              showMonthYearPicker={isPlanning}
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-[#82939b]"
              calendarClassName="custom-calendar"
              wrapperClassName="w-full"
            />
          </ControlShell>
        </Field>

        <Field label={isPlanning ? "Latest Start" : "End Date"}>
          <ControlShell className="bg-white">
            <DatePicker
              selected={value.end ? new Date(value.end) : null}
              onChange={handleEndChange}
              selectsEnd
              startDate={value.start ? new Date(value.start) : null}
              endDate={value.end ? new Date(value.end) : null}
              minDate={value.start ? new Date(value.start) : new Date()}
              placeholderText={
                isPlanning ? "Select latest date" : "Select end date"
              }
              dateFormat={isPlanning ? "MMMM yyyy" : "MMM d, yyyy"}
              showMonthYearPicker={isPlanning}
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-[#82939b]"
              calendarClassName="custom-calendar"
              wrapperClassName="w-full"
            />
          </ControlShell>
        </Field>
      </div>

      {/* ...existing code... */}
      {isPlanning ? (
        <>
          <Field label="Approximate Duration (Days)">
            <div className="mb-6">
              <input
                type="range"
                min="3"
                max="30"
                value={Number(value.durationDays || 7)}
                onChange={(e) =>
                  onChange({ ...value, durationDays: Number(e.target.value) })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#e3d8c4] accent-[#0c5f5c]"
              />
              <div className="mt-1 text-right text-sm font-semibold text-[#2f4954]">
                {Number(value.durationDays || 7)} Days
              </div>
            </div>
          </Field>

          <div className="mb-2 text-sm font-semibold text-slate-900">
            What matters for timing?
          </div>
          <div className="flex flex-wrap gap-2">
            <PillButton
              active={value.timingPriority?.includes("weather")}
              onClick={() => togglePriority("weather")}
            >
              <Sun className="w-4 h-4 inline mr-2" /> Best Weather
            </PillButton>

            <PillButton
              active={value.timingPriority?.includes("crowds")}
              onClick={() => togglePriority("crowds")}
            >
              <Users className="w-4 h-4 inline mr-2" /> Avoid Crowds
            </PillButton>

            <PillButton
              active={value.timingPriority?.includes("price")}
              onClick={() => togglePriority("price")}
            >
              <DollarSign className="w-4 h-4 inline mr-2" /> Cheapest Price
            </PillButton>
          </div>

          <div className="mt-5 rounded-[18px] border border-[#d9ccb7] bg-[#fff7e9] p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
              Smart Window
            </div>
            <p className="mt-1 text-[13px] text-[#556871]">
              Flexible timing usually unlocks better flight prices and calmer
              crowds.
            </p>
          </div>
        </>
      ) : null}
    </Card>
  );
}
