import React from "react";
import { Mountain, Building2, History, Palette, Tent, ShoppingBag, Moon, Coffee, Camera, BookOpen } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";

const INTERESTS = [
  { id: "nature", label: "Nature", icon: Mountain },
  { id: "city", label: "City Life", icon: Building2 },
  { id: "history", label: "History", icon: History },
  { id: "culture", label: "Culture", icon: BookOpen },
  { id: "adventure", label: "Adventure", icon: Tent },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "nightlife", label: "Nightlife", icon: Moon },
  { id: "relaxation", label: "Relaxation", icon: Coffee },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "art", label: "Art & Museums", icon: Palette },
];

const PACES = [
  { id: "slow", label: "Slow", desc: "1-2 activities/day" },
  { id: "balanced", label: "Balanced", desc: "Active but rested" },
  { id: "packed", label: "Packed", desc: "See everything" },
];

const HATES = [
  { id: "crowds", label: "Crowds" },
  { id: "early_mornings", label: "Early Mornings" },
  { id: "tourist_traps", label: "Tourist Traps" },
  { id: "planning_stress", label: "Planning Stress" },
];

export default function TravelStyleSection({ value, onChange }) {
  const interests = value.interests || [];
  const hates = value.hates || [];

  const toggleInterest = (id) => {
    const next = interests.includes(id) 
      ? interests.filter(x => x !== id) 
      : [...interests, id];
    onChange({ ...value, interests: next });
  };

  const toggleHate = (id) => {
    const next = hates.includes(id) 
      ? hates.filter(x => x !== id) 
      : [...hates, id];
    onChange({ ...value, hates: next });
  };

  return (
    <Card>
      <SectionHeader title="Travel Style" subtitle="Define your vibe." />

      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          What interests you?
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((item) => {
            const Icon = item.icon;
            return (
              <PillButton
                key={item.id}
                active={interests.includes(item.id)}
                onClick={() => toggleInterest(item.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Preferred Pace
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PACES.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...value, travelPace: p.id })}
              className={`
                p-3 rounded-xl border-2 text-center transition-all
                ${value.travelPace === p.id 
                  ? "border-black bg-gray-50" 
                  : "border-gray-100 bg-white hover:border-gray-200"
                }
              `}
            >
              <div className="font-semibold text-sm">{p.label}</div>
              <div className="text-[11px] text-gray-400">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Avoid these (Hates)
        </label>
        <div className="flex flex-wrap gap-2">
          {HATES.map((h) => (
            <PillButton
              key={h.id}
              active={hates.includes(h.id)}
              onClick={() => toggleHate(h.id)}
            >
              {h.label}
            </PillButton>
          ))}
        </div>
      </div>

      <Field label="Describe your taste (Free Text)">
        <ControlShell className="bg-white">
          <textarea
            rows={3}
            value={value.tasteText || ""}
            onChange={(e) => onChange({ ...value, tasteText: e.target.value })}
            placeholder="e.g. I love hidden gems, local cafes, and slow mornings..."
            className="w-full bg-transparent outline-none text-base text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </ControlShell>
      </Field>
    </Card>
  );
}