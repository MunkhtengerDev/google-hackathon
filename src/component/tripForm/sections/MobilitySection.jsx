import React from "react";
import { Car, Train, Footprints, Bike, Bus, MapPin } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";

const MODES = [
  { id: "walking", label: "Walking", icon: Footprints },
  { id: "public_transit", label: "Public Transit", icon: Train },
  { id: "taxi", label: "Taxi / Rideshare", icon: Car },
  { id: "rental_car", label: "Rental Car", icon: Car },
  { id: "bike", label: "Bike / Scooter", icon: Bike },
  { id: "tour_bus", label: "Tour Transport", icon: Bus },
];

const RANGES = [
  { id: "15", label: "Up to 15 min" },
  { id: "30", label: "Up to 30 min" },
  { id: "60", label: "Up to 60 min" },
  { id: "flexible", label: "Flexible" },
];

export default function MobilitySection({ value, onChange }) {
  const transport = value.preferredTransport || [];

  const toggleMode = (id) => {
    const next = transport.includes(id) 
      ? transport.filter((x) => x !== id) 
      : [...transport, id];
    onChange({ ...value, preferredTransport: next });
  };

  return (
    <Card>
      <SectionHeader
        title="Mobility & Movement"
        subtitle="How do you want to get around?"
      />

      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Preferred Transport
        </label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <PillButton
                key={m.id}
                active={transport.includes(m.id)}
                onClick={() => toggleMode(m.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Daily Travel Comfort Range
        </label>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <PillButton
              key={r.id}
              active={value.comfortRange === r.id}
              onClick={() => onChange({ ...value, comfortRange: r.id })}
            >
              {r.label}
            </PillButton>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Max time you are willing to commute between attractions.
        </p>
      </div>

      <Field label="Mobility Notes">
        <ControlShell className="bg-white">
          <textarea
            rows={2}
            value={value.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="e.g. Avoid stairs, need wheelchair access..."
            className="w-full bg-transparent outline-none text-base text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </ControlShell>
      </Field>
    </Card>
  );
}