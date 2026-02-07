import React from "react";
import { Calendar, Compass, CheckCircle } from "lucide-react";
import { Card, SectionHeader, OptionCard } from "../../../ui/primitives";

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
          description="Get timing, price ranges, visa reminders, and priorities."
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

      <div className="mt-5 rounded-[20px] border border-[#ddd0bc] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#566a73]">Planner Tip</div>
        <div className="mt-2 text-[13px] text-[#52666f]">
          If you have flights/hotel confirmed, pick{" "}
          <span className="font-semibold text-[#294450]">Already booked</span>.
          Otherwise pick{" "}
          <span className="font-semibold text-[#294450]">Planning to book</span>.
        </div>
      </div>
    </Card>
  );
}
