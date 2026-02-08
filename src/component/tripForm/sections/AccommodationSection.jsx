import React from "react";
import { Hotel, Home, BedDouble, Users } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";
import HotelLocationInput from "../../../ui/HotelLocationInput";

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
  { id: "budget", label: "Budget Friendly" },
  { id: "luxury", label: "Luxury / High-end" },
];

export default function AccommodationSection({ value, onChange, mapsApiKey }) {
  const prefs = value.preference || [];
  const hotels = value.hotels || [];
  const status = value.status || "not_booked";
  const type = value.type || "";

  const togglePref = (id) => {
    const next = prefs.includes(id) ? prefs.filter((x) => x !== id) : [...prefs, id];
    onChange({ ...value, preference: next });
  };

  // Determine placeholder text based on type
  const getLocationPlaceholder = () => {
    if (type === "friends") return "Enter friend's area or address...";
    if (type === "apartment") return "Enter Airbnb area or address...";
    return "Search hotel name or address...";
  };

  return (
    <Card>
      <SectionHeader title="Accommodation" subtitle="Where will you be staying?" />

      {/* 1. Status */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Booking Status
        </label>
        <div className="flex gap-3">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange({ ...value, status: opt.id })}
              className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                status === opt.id ? "border-black bg-gray-50 text-black" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Type */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Accommodation Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange({ ...value, type: t.id })}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  isActive ? "border-black bg-gray-50 text-black" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-400"}`} />
                <span className="font-medium text-sm">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Location Input (Show if any type is selected, needed for Mobility map) */}
      {type && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <HotelLocationInput
            apiKey={mapsApiKey}
            value={hotels}
            onChange={(nextHotels) => onChange({ ...value, hotels: nextHotels })}
            max={5}
            label={status === "booked" ? "Where are you staying?" : "Intended Location / Area"}
            placeholder={getLocationPlaceholder()}
          />
          <p className="mt-2 text-[12px] text-[#717171]">
            {status === "booked" 
              ? "We use this exact location to optimize your daily route." 
              : "Enter a general area or potential hotel to estimate travel times."}
          </p>
        </div>
      )}

      {/* 4. Preferences & Budget (Only if NOT Booked) */}
      {status === "not_booked" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Budget Suggestion */}
          <Field label="Target Budget (Per Night)" right={<span className="text-xs text-gray-400">Optional</span>}>
            <ControlShell className="bg-white">
                <span className="text-gray-400 mr-2">$</span>
                <input 
                    type="number" 
                    placeholder="e.g. 150"
                    value={value.budgetPerNight || ""}
                    onChange={(e) => onChange({...value, budgetPerNight: e.target.value})}
                    className="w-full bg-transparent outline-none font-semibold text-gray-800"
                />
            </ControlShell>
            <p className="mt-2 text-[12px] text-[#717171]">We'll suggest places within this range.</p>
          </Field>

          {/* Location Preferences */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              Location Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {PREFS.map((p) => (
                <PillButton key={p.id} active={prefs.includes(p.id)} onClick={() => togglePref(p.id)}>
                  {p.label}
                </PillButton>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}