// src/sections/DestinationSection.jsx
import React, { useState } from "react";
import { Globe, MapPin, Navigation, ChevronRight } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, PillButton } from "../../ui/primitives";

export default function DestinationSection({ tripStatus, value, onChange }) {
  const [focus, setFocus] = useState(null);

  const title = tripStatus === "booked" ? "Where are you traveling?" : "Where do you want to go?";

  const popular = [
    { country: "Japan", city: "Tokyo", emoji: "🗾" },
    { country: "Italy", city: "Rome", emoji: "🇮🇹" },
    { country: "Thailand", city: "Bangkok", emoji: "🇹🇭" },
    { country: "France", city: "Paris", emoji: "🇫🇷" },
    { country: "USA", city: "New York", emoji: "🇺🇸" },
    { country: "Australia", city: "Sydney", emoji: "🇦🇺" },
  ];

  return (
    <Card>
      <SectionHeader
        icon={<Globe className="w-5 h-5" />}
        title={title}
        subtitle="Start with a country. Add a city for better recommendations."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label="Country *" hint="Required">
          <ControlShell focused={focus === "country"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-[18px]">🌍</div>
              <input
                value={value.country || ""}
                onChange={(e) => onChange({ ...value, country: e.target.value })}
                onFocus={() => setFocus("country")}
                onBlur={() => setFocus(null)}
                placeholder="e.g., Japan"
                className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </ControlShell>
        </Field>

        <Field label="City (optional)" hint="Nice for itinerary suggestions">
          <ControlShell focused={focus === "city"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-[18px]">🏙️</div>
              <input
                value={value.city || ""}
                onChange={(e) => onChange({ ...value, city: e.target.value })}
                onFocus={() => setFocus("city")}
                onBlur={() => setFocus(null)}
                placeholder="e.g., Tokyo"
                className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </ControlShell>
        </Field>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-slate-900">Popular picks</div>
          <div className="text-[12px] text-slate-500">Tap to apply</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {popular.map((d) => {
            const active = value.country === d.country && value.city === d.city;
            return (
              <PillButton
                key={`${d.country}-${d.city}`}
                active={active}
                onClick={() => onChange({ ...value, country: d.country, city: d.city })}
                className="flex items-center gap-2"
              >
                <span>{d.emoji}</span>
                <span>{d.city}</span>
              </PillButton>
            );
          })}
        </div>
      </div>

      <Field label="Extra details" hint="Optional: regions, multiple cities, day trips">
        <ControlShell focused={focus === "notes"} className="bg-white">
          <div className="flex items-start gap-3">
            <Navigation className="w-4 h-4 text-slate-500 mt-1" />
            <textarea
              rows={3}
              value={value.notes || ""}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              onFocus={() => setFocus("notes")}
              onBlur={() => setFocus(null)}
              placeholder="e.g., Kyoto + Osaka, countryside day trips, museums + food…"
              className="w-full bg-transparent outline-none text-[14px] text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
          <div className="mt-2 text-[12px] text-slate-500">{(value.notes || "").length}/500</div>
        </ControlShell>
      </Field>

      {(value.country || value.city) ? (
        <div className="mt-6 rounded-[16px] border border-slate-200 bg-white p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-[14px] bg-slate-900 text-white flex items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-900">Preview</div>
            <div className="text-[13px] text-slate-600 truncate">
              {[value.city, value.country].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
