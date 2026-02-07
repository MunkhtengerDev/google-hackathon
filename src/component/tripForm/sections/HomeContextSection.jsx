import React, { useState } from "react";
import { Home, MapPin, Loader2 } from "lucide-react";
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

export default function HomeContextSection({ value, onChange, mapsApiKey, onFocusQuery }) {
  const [loading, setLoading] = useState(false);

  const detectLocation = async () => {
    setLoading(true);
    try {
      // 1) Browser GPS first
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("no geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // reverse geocode → country/city
      let geo = null;
      try {
        geo = await reverseGeocode(lat, lng, mapsApiKey);
      } catch {
        geo = null;
      }

      // IP fallback for currency + backup
      const ip = await ipFallback();

      const next = {
        ...value,
        homeCountry: geo?.country || ip.country_name || value.homeCountry || "",
        departureCity: geo?.city || ip.city || value.departureCity || "",
        currency: ip.currency || value.currency || "USD",
      };

      onChange(next);
      onFocusQuery?.([next.departureCity, next.homeCountry].filter(Boolean).join(", "));
    } catch {
      // last resort
      try {
        const ip = await ipFallback();
        const next = {
          ...value,
          homeCountry: ip.country_name || value.homeCountry || "",
          departureCity: ip.city || value.departureCity || "",
          currency: ip.currency || value.currency || "USD",
        };
        onChange(next);
        onFocusQuery?.([next.departureCity, next.homeCountry].filter(Boolean).join(", "));
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
        subtitle="Where are you starting from?"
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
        <Field label="Home Country">
          <ControlShell className="bg-white">
            <input
              value={value.homeCountry || ""}
              onChange={(e) => {
                const v = { ...value, homeCountry: e.target.value };
                onChange(v);
                onFocusQuery?.(e.target.value);
              }}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="e.g. Mongolia"
            />
          </ControlShell>
        </Field>

        <Field label="Departure City">
          <ControlShell className="bg-white">
            <input
              value={value.departureCity || ""}
              onChange={(e) => {
                const v = { ...value, departureCity: e.target.value };
                onChange(v);
                onFocusQuery?.(e.target.value);
              }}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="e.g. Ulaanbaatar"
            />
          </ControlShell>
        </Field>

        <Field label="Currency">
          <ControlShell className="bg-white">
            <input
              value={value.currency || "USD"}
              onChange={(e) => onChange({ ...value, currency: e.target.value })}
              className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#809097]"
              placeholder="USD"
            />
          </ControlShell>
        </Field>
      </div>

      <div className="mt-5 rounded-[18px] border border-[#d9ccb7] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
          Why this matters
        </div>
        <p className="mt-1 text-[13px] text-[#556871]">
          We use home context to estimate flight ranges, compare value windows,
          and optimize realistic routes.
        </p>
      </div>
    </Card>
  );
}
