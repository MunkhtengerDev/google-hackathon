import React from "react";
import { Compass, CheckCircle } from "lucide-react";
import { OptionCard } from "../../../ui/primitives"; // Using our new primitive

export default function TripStatusSection({ value, onChange }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 gap-4">
        <OptionCard
          active={value === "planning"}
          onClick={() => onChange("planning")}
          icon={<Compass className="w-5 h-5" />}
          title="I'm just planning"
          description="I haven't booked anything yet. I need inspiration, estimated costs, and best times to fly."
        />

        <OptionCard
          active={value === "booked"}
          onClick={() => onChange("booked")}
          icon={<CheckCircle className="w-5 h-5" />}
          title="I'm already booked"
          description="I have my flights or hotel. I need an itinerary that fits my confirmed dates."
        />
      </div>
    </div>
  );
}
