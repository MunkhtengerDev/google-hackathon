// src/sections/MobilitySection.jsx
import React, { useState } from "react";
import { Car, Train, Footprints, Bike, Navigation, Map } from "lucide-react";
import { Card, SectionHeader, PillButton, Field, ControlShell } from "../../ui/primitives";

const OPTIONS = [
  { id: "walking", label: "Walking", icon: Footprints, desc: "Explore on foot" },
  { id: "public", label: "Public transit", icon: Train, desc: "Buses, trains, metro" },
  { id: "taxi", label: "Taxi / rideshare", icon: Car, desc: "Door-to-door" },
  { id: "rental", label: "Rental car", icon: Car, desc: "Freedom to explore" },
  { id: "bike", label: "Bike / scooter", icon: Bike, desc: "Quick & local" },
  { id: "tour", label: "Tour transport", icon: Navigation, desc: "Guided experiences" },
];

export default function MobilitySection({ value, onChange }) {
  const [focus, setFocus] = useState(false);

  const modes = value.modes || [];

  const toggle = (id) => {
    const next = modes.includes(id) ? modes.filter((x) => x !== id) : [...modes, id];
    onChange({ ...value, modes: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<Navigation className="w-5 h-5" />}
        title="Getting around"
        subtitle="Select any travel modes you like."
        right={
          <div className="text-right">
            <div className="text-[12px] text-slate-500">Selected</div>
            <div className="text-[18px] font-semibold text-slate-900">{modes.length}</div>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = modes.includes(o.id);
          return (
            <PillButton
              key={o.id}
              active={active}
              onClick={() => toggle(o.id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {o.label}
            </PillButton>
          );
        })}
      </div>

      <Field label="Mobility notes" hint="Optional: accessibility, avoid driving, love scenic trains…">
        <ControlShell focused={focus} className="bg-white">
          <textarea
            rows={3}
            value={value.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="e.g., Prefer walkable neighborhoods. Need elevators. Avoid long stairs…"
            className="w-full bg-transparent outline-none text-[14px] text-slate-900 placeholder:text-slate-400 resize-none"
          />
          <div className="mt-2 text-[12px] text-slate-500">{(value.notes || "").length}/500</div>
        </ControlShell>
      </Field>

      {modes.length ? (
        <div className="mt-6 rounded-[16px] border border-slate-200 bg-white p-4">
          <div className="text-[13px] font-semibold text-slate-900">Your transport mix</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {modes.map((id) => {
              const o = OPTIONS.find((x) => x.id === id);
              if (!o) return null;
              const Icon = o.icon;
              return (
                <span key={id} className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-[13px]">
                  <Icon className="w-4 h-4 text-slate-700" />
                  {o.label}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[16px] border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
          <Map className="w-4 h-4" />
          Tip
        </div>
        <div className="mt-1 text-[13px] text-slate-600">
          Walking + public transit usually gives the best “local” experience in cities.
        </div>
      </div>
    </Card>
  );
}
