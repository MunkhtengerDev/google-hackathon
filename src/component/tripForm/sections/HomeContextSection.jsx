import React, { useState } from "react";
import { Home, MapPin, Loader2, Plane, Globe, RefreshCw } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell } from "../../../ui/primitives";

async function ipFallback() {
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) throw new Error("ipapi failed");
  return res.json();
}

async function reverseGeocode(lat, lng, apiKey) {
  if (!apiKey) throw new Error("no maps key");
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.status !== "OK") throw new Error("geocode failed");

  const first = json.results?.[0];
  const comps = first?.address_components || [];

  const country = comps.find((c) => c.types.includes("country"))?.long_name || "";
  const city =
    comps.find((c) => c.types.includes("locality"))?.long_name ||
    comps.find((c) => c.types.includes("administrative_area_level_1"))?.long_name ||
    "";

  return { country, city };
}

async function fetchCurrencyByCountry(countryName = "") {
  const target = String(countryName || "").trim();
  if (!target) return "";

  const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(target)}`);
  if (!res.ok) throw new Error("Country not found");

  const data = await res.json();
  const firstMatch = Array.isArray(data) ? data[0] : null;
  if (!firstMatch?.currencies || typeof firstMatch.currencies !== "object") {
    throw new Error("Currency data missing");
  }

  const firstCode = Object.keys(firstMatch.currencies)[0] || "";
  return String(firstCode).toUpperCase().slice(0, 3);
}

export default function HomeContextSection({ value, onChange, mapsApiKey, onFocusQuery }) {
  const [loading, setLoading] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // 1. Detect currency based on the text written in "Living Country"
  const handleDetectCurrency = async ({ showMissingAlert = true } = {}) => {
    const targetCountry = value.homeCountry || value.livingCountry;
    
    if (!targetCountry) {
        if (showMissingAlert) {
          alert("Please enter a living country first.");
        }
        return;
    }

    setCurrencyLoading(true);
    try {
      const currencyCode = await fetchCurrencyByCountry(targetCountry);
      if (!currencyCode) return;

      onChange({
        ...value,
        currency: currencyCode,
      });
    } catch (error) {
      console.error("Could not fetch currency:", error);
    } finally {
      setCurrencyLoading(false);
    }
  };

  // 2. Global Location Detection (GPS)
  const detectLocation = async () => {
    setLoading(true);
    try {
      // Browser GPS
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("no geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let geo = null;
      try {
        geo = await reverseGeocode(lat, lng, mapsApiKey);
      } catch {
        geo = null;
      }

      // IP fallback
      const ip = await ipFallback();

      const detectedCountry = geo?.country || ip.country_name || "";
      const detectedCity = geo?.city || ip.city || "";
      const detectedCurrency = ip.currency || "USD";

      const next = {
        ...value,
        citizenship: value.citizenship || detectedCountry,
        homeCountry: detectedCountry || value.homeCountry || value.livingCountry || "",
        departureCity: detectedCity || value.departureCity || "",
        currency: detectedCurrency || value.currency || "USD",
      };

      onChange(next);
      onFocusQuery?.([next.departureCity, next.homeCountry].filter(Boolean).join(", "));
    } catch {
      try {
        const ip = await ipFallback();
        const next = {
          ...value,
          citizenship: value.citizenship || ip.country_name || "",
          homeCountry:
            ip.country_name || value.homeCountry || value.livingCountry || "",
          departureCity: ip.city || value.departureCity || "",
          currency: ip.currency || value.currency || "USD",
        };
        onChange(next);
      } catch (e) {
        console.error("Location detection failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionHeader
        icon={<Home className="w-5 h-5" />}
        title="Home & Context"
        subtitle="Visa status and Flight origin"
      />

      <div className="mb-6 flex justify-end">
        <button
          onClick={detectLocation}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d6a66] to-[#084744] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(12,95,92,0.24)] transition hover:brightness-105"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
          Detect my location
        </button>
      </div>

      <div className="space-y-4">
        {/* CITIZENSHIP */}
        <Field label="Citizenship / Passport" icon={<Globe className="w-3 h-3 text-gray-400" />}>
          <ControlShell className="bg-white">
            <input
              value={value.citizenship || ""}
              onChange={(e) => onChange({ ...value, citizenship: e.target.value })}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="e.g. Mongolia"
            />
          </ControlShell>
        </Field>

        <div className="h-px bg-gray-100 my-2" />

        {/* LIVING COUNTRY */}
        <Field label="Living Country" icon={<Plane className="w-3 h-3 text-gray-400" />}>
          <ControlShell className="bg-white">
            <input
              value={value.homeCountry || value.livingCountry || ""}
              onChange={(e) => {
                  onChange({ ...value, homeCountry: e.target.value });
                  onFocusQuery?.(e.target.value);
              }}
              onBlur={() => {
                handleDetectCurrency({ showMissingAlert: false });
              }}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="e.g. United Kingdom"
            />
          </ControlShell>
        </Field>

        {/* DEPARTURE CITY */}
        <Field label="Departure City">
          <ControlShell className="bg-white">
            <input
              value={value.departureCity || ""}
              onChange={(e) => onChange({ ...value, departureCity: e.target.value })}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="e.g. London"
            />
          </ControlShell>
        </Field>

        {/* CURRENCY with DETECT BUTTON */}
        <Field label="Currency">
          <ControlShell className="bg-white flex items-center gap-2 pr-2">
            <input
              value={value.currency || "USD"}
              onChange={(e) =>
                onChange({
                  ...value,
                  currency: e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 3),
                })
              }
              className="flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="USD"
            />
            {/* Auto-detect button */}
            <button
                onClick={() => handleDetectCurrency({ showMissingAlert: true })}
                disabled={!(value.homeCountry || value.livingCountry) || currencyLoading}
                title="Detect currency from Living Country"
                className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
            >
                {currencyLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <RefreshCw className="w-3 h-3" />
                )}
                <span>Auto</span>
            </button>
          </ControlShell>
        </Field>
      </div>

      <div className="mt-5 rounded-[18px] border border-[#d9ccb7] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
          Why this matters
        </div>
        <p className="mt-1 text-[13px] text-[#556871]">
          Use the <strong>Auto</strong> button to sync your currency with your Living Country.
        </p>
      </div>
    </Card>
  );
}
