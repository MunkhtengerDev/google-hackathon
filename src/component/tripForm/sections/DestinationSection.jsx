import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Globe, Map } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";
import LocationInput from "../../../ui/LocationInput";

const norm = (s) => (s || "").trim().toLowerCase();

function extractCountryFromPlace(placeDetails) {
  const comps = placeDetails?.address_components || [];
  const countryComp = comps.find((c) => c.types?.includes("country"));
  if (!countryComp) return null;

  return {
    countryName: countryComp.long_name || "",
    countryCode: countryComp.short_name || "", // <-- ISO-ish code like "FR"
  };
}

export default function DestinationSection({ value, onChange, mapsApiKey, onFocusQuery }) {
  // City -> { countryName, countryCode }
  const [cityMeta, setCityMeta] = useState({});
  // Country label -> { countryName, countryCode }
  const [countryMeta, setCountryMeta] = useState({});

  const handleCityContext = useCallback((cityName, placeDetails) => {
    const info = extractCountryFromPlace(placeDetails);
    if (!info) return;

    setCityMeta((prev) => ({
      ...prev,
      [cityName]: info, // { countryName, countryCode }
    }));
  }, []);

  const handleCountryContext = useCallback((countryLabel, placeDetails) => {
    const info = extractCountryFromPlace(placeDetails);
    if (!info) return;

    // For country autocomplete, the selected "label" might be same as info.countryName,
    // but we store by label so we can match what user sees in chips.
    setCountryMeta((prev) => ({
      ...prev,
      [countryLabel]: info,
    }));
  }, []);

  const optimizedRoute = useMemo(() => {
    const selectedCountries = value.countries || [];
    const selectedCities = value.cities || [];
    const selectedRegions = value.regions || [];

    // Countries covered by selected cities (prefer code match; also keep name fallback)
    const coveredCountryCodes = new Set();
    const coveredCountryNames = new Set();

    selectedCities.forEach((city) => {
      const meta = cityMeta[city];
      if (meta?.countryCode) coveredCountryCodes.add(meta.countryCode);
      if (meta?.countryName) coveredCountryNames.add(norm(meta.countryName));
    });

    const effectiveCountries = selectedCountries.filter((countryLabel) => {
      const meta = countryMeta[countryLabel];

      // If we have codes, use them (best)
      if (meta?.countryCode && coveredCountryCodes.has(meta.countryCode)) return false;

      // Fallback: normalized string compare (handles "France" vs "French Republic" sometimes poorly,
      // but still useful when code is missing)
      if (coveredCountryNames.has(norm(countryLabel))) return false;
      if (meta?.countryName && coveredCountryNames.has(norm(meta.countryName))) return false;

      return true;
    });

    // Order: Cities -> Regions -> Remaining Countries
    return [...selectedCities, ...selectedRegions, ...effectiveCountries];
  }, [value.countries, value.cities, value.regions, cityMeta, countryMeta]);

  useEffect(() => {
    if (optimizedRoute.length > 0) {
      onFocusQuery?.(optimizedRoute.join(" to "));
    }
  }, [optimizedRoute, onFocusQuery]);

  return (
    <Card>
      <SectionHeader
        icon={<Globe className="w-5 h-5" />}
        title="Destination"
        subtitle="Add one or more places. You can mix countries, cities, and regions."
      />

      <div className="space-y-6">
        <LocationInput
          apiKey={mapsApiKey}
          label="Countries"
          placeholder="e.g. France, Spain..."
          value={value.countries || []}
          onChange={(countries) => onChange({ ...value, countries })}
          onContextData={handleCountryContext}   // ✅ NEW
          types={["country"]}
        />

        <LocationInput
          apiKey={mapsApiKey}
          label="Cities"
          placeholder="e.g. Paris, Tokyo..."
          value={value.cities || []}
          onChange={(cities) => onChange({ ...value, cities })}
          onContextData={handleCityContext}
          types={["(cities)"]}
        />

        <LocationInput
          apiKey={mapsApiKey}
          label="Regions / Areas"
          placeholder="e.g. Bali, Tuscany..."
          value={value.regions || []}
          onChange={(regions) => onChange({ ...value, regions })}
          types={["geocode"]}
        />
      </div>

      {(value.countries?.length > 0 || value.cities?.length > 0) && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => onFocusQuery?.(optimizedRoute.join(" to "))}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
          >
            <Map className="h-4 w-4" />
            Preview route on map
          </button>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-[#d9ccb7] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
          Route Optimization
        </div>
        <p className="mt-1 text-[13px] text-[#556871]">
          If you select a city (e.g., <strong>Paris</strong>) and its country (e.g., <strong>France</strong>),
          we automatically prioritize the city for your route visualization.
        </p>
      </div>
    </Card>
  );
}
