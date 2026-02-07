import React from "react";
import { Globe } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";
import LocationInput from "../../../ui/LocationInput";

export default function DestinationSection({ value, onChange, mapsApiKey, onFocusQuery }) {
  return (
    <Card>
      <SectionHeader
        icon={<Globe className="w-5 h-5" />}
        title="Destination"
        subtitle="Add one or more places. You can mix countries, cities, and regions."
      />

      <div className="space-y-4">
        <LocationInput
          apiKey={mapsApiKey}
          label="Countries"
          hint="Multiple countries supported"
          value={value.countries || []}
          onChange={(countries) => onChange({ ...value, countries })}
          placeholder="Search country (e.g., Japan)…"
          onFocusQuery={onFocusQuery}
        />

        <LocationInput
          apiKey={mapsApiKey}
          label="Cities"
          hint="Optional: add multiple cities"
          value={value.cities || []}
          onChange={(cities) => onChange({ ...value, cities })}
          placeholder="Search city (e.g., Tokyo)…"
          onFocusQuery={onFocusQuery}
        />

        <LocationInput
          apiKey={mapsApiKey}
          label="Regions / Areas"
          hint="Optional: neighborhoods, states, islands…"
          value={value.regions || []}
          onChange={(regions) => onChange({ ...value, regions })}
          placeholder="Search region (e.g., Kansai)…"
          onFocusQuery={onFocusQuery}
        />
      </div>

      <div className="mt-5 rounded-[18px] border border-[#d9ccb7] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
          Multi-stop Ready
        </div>
        <p className="mt-1 text-[13px] text-[#556871]">
          Add several places to preview routes and compare itinerary options in
          real time.
        </p>
      </div>
    </Card>
  );
}
