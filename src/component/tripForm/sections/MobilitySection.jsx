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
  const transport = Array.isArray(value?.preferredTransport)
    ? value.preferredTransport
    : [];
  const comfortRange = value?.comfortRange || "30";

  const toggleMode = (id) => {
    const next = transport.includes(id)
      ? transport.filter((item) => item !== id)
      : [...transport, id];
    onChange({ ...value, preferredTransport: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<MapPin className="w-5 h-5" />}
        title="Mobility & Movement"
        subtitle="Set your transport style and daily comfort range."
      />

      <div className="mb-8">
        <label className="mb-3 block text-[12px] font-bold uppercase tracking-wider text-gray-500">
          Preferred Transport
        </label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <PillButton
                key={mode.id}
                active={transport.includes(mode.id)}
                onClick={() => toggleMode(mode.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {mode.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <label className="mb-3 block text-[12px] font-bold uppercase tracking-wider text-gray-500">
          Daily Travel Comfort Range
        </label>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((range) => (
            <PillButton
              key={range.id}
              active={comfortRange === range.id}
              onClick={() => onChange({ ...value, comfortRange: range.id })}
            >
              {range.label}
            </PillButton>
          ))}
        </div>
      </div>

      <Field label="Mobility Notes">
        <ControlShell className="bg-white">
          <textarea
            rows={2}
            value={value?.notes || ""}
            onChange={(event) => onChange({ ...value, notes: event.target.value })}
            placeholder="e.g. Avoid stairs, need wheelchair access..."
            className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </ControlShell>
      </Field>
    </Card>
  );
}
