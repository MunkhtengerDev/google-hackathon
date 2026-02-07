// src/sections/TripStatusSection.jsx
import React from "react";
import { Calendar, Compass, CheckCircle } from "lucide-react";
import { Card, SectionHeader, OptionCard } from "../../ui/primitives";

export default function TripStatusSection({ value, onChange }) {
  return (
    <Card>
      <SectionHeader
        icon={<Calendar className="w-5 h-5" />}
        title="Trip status"
        subtitle="Choose how we should guide you."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionCard
          active={value === "planning"}
          onClick={() => onChange("planning")}
          title="Planning to book"
          description="Get timing, price ranges, visa reminders, and what to prioritize."
          icon={<Compass className="w-6 h-6" />}
          meta="Research mode"
        />

        <OptionCard
          active={value === "booked"}
          onClick={() => onChange("booked")}
          title="Already booked"
          description="Build a smooth itinerary and discover local experiences."
          icon={<CheckCircle className="w-6 h-6" />}
          meta="Itinerary mode"
        />
      </div>

      <div className="mt-5 rounded-[16px] border border-slate-200 bg-slate-50/60 p-4">
        <div className="text-[13px] font-semibold text-slate-900">Tip</div>
        <div className="mt-1 text-[13px] text-slate-600">
          If you have flights/hotel confirmed, pick <span className="font-medium">Already booked</span>.
          Otherwise pick <span className="font-medium">Planning to book</span>.
        </div>
      </div>
    </Card>
  );
}
