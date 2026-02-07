import React from "react";
import { Hotel, Home, BedDouble, Users } from "lucide-react";
import { Card, SectionHeader, PillButton } from "../../../ui/primitives";

const STATUS_OPTS = [
  { id: "booked", label: "Already Booked" },
  { id: "not_booked", label: "Not Booked Yet" },
];

const TYPES = [
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "apartment", label: "Airbnb / Apt", icon: Home },
  { id: "guesthouse", label: "Guesthouse", icon: BedDouble },
  { id: "friends", label: "Staying w/ Friends", icon: Users },
];

const PREFS = [
  { id: "central", label: "Central Location" },
  { id: "quiet", label: "Quiet Area" },
  { id: "near_transport", label: "Near Metro/Train" },
  { id: "scenic", label: "Scenic View" },
];

export default function AccommodationSection({ value, onChange }) {
  const prefs = value.preference || [];

  const togglePref = (id) => {
    const next = prefs.includes(id) ? prefs.filter(x => x !== id) : [...prefs, id];
    onChange({ ...value, preference: next });
  };

  return (
    <Card>
      <SectionHeader title="Accommodation" subtitle="Where are you staying?" />

      {/* Status */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Booking Status
        </label>
        <div className="flex gap-3">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange({ ...value, status: opt.id })}
              className={`
                flex-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all
                ${value.status === opt.id 
                  ? "border-black bg-gray-50" 
                  : "border-gray-100 bg-white text-gray-500"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Accommodation Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onChange({ ...value, type: t.id })}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                  ${value.type === t.id 
                    ? "border-black bg-gray-50" 
                    : "border-gray-100 bg-white text-gray-500"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Location Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFS.map((p) => (
            <PillButton
              key={p.id}
              active={prefs.includes(p.id)}
              onClick={() => togglePref(p.id)}
            >
              {p.label}
            </PillButton>
          ))}
        </div>
      </div>
    </Card>
  );
}