import React, { useEffect, useMemo, useRef, useState } from "react";
import { Car, Train, Footprints, Bike, Bus, MapPin } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";
import { loadGoogleMaps } from "../../../lib/googleMapsLoader";

const MODES = [
  { id: "walking", label: "Walking", icon: Footprints },
  { id: "public_transit", label: "Public Transit", icon: Train },
  { id: "taxi", label: "Taxi / Rideshare", icon: Car },
  { id: "rental_car", label: "Rental Car", icon: Car },
  { id: "bike", label: "Bike / Scooter", icon: Bike },
  { id: "tour_bus", label: "Tour Transport", icon: Bus },
];

const RANGES = [
  { id: "15", label: "Up to 15 min", minutes: 15 },
  { id: "30", label: "Up to 30 min", minutes: 30 },
  { id: "60", label: "Up to 60 min", minutes: 60 },
  { id: "flexible", label: "Flexible", minutes: null },
];

// Speed in km/h for circle estimation
const SPEED_KMPH = {
  walking: 4.5,
  bike: 14,
  public_transit: 22,
  taxi: 28,
  rental_car: 32,
  tour_bus: 24,
};

function kmRadiusFrom(modeId, minutes) {
  if (!minutes) return null;
  const kmph = SPEED_KMPH[modeId] ?? 20;
  return kmph * (minutes / 60);
}

const kmToMeters = (km) => km * 1000;

export default function MobilitySection({ value, onChange, mapsApiKey, hotels = [] }) {
  const transport = value.preferredTransport || [];
  const comfortRange = value.comfortRange || "30";

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const selectedMinutes = useMemo(() => {
    const r = RANGES.find((x) => x.id === comfortRange);
    return r?.minutes ?? 30;
  }, [comfortRange]);

  const toggleMode = (id) => {
    const next = transport.includes(id) ? transport.filter((x) => x !== id) : [...transport, id];
    onChange({ ...value, preferredTransport: next });
  };

  // 1. Initialize Google Map
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!mapsApiKey || !mapDivRef.current) return;
        const g = await loadGoogleMaps(mapsApiKey);
        if (!alive) return;

        const map = new g.maps.Map(mapDivRef.current, {
          zoom: 13,
          center: { lat: 48.8566, lng: 2.3522 },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (e) {
        console.error("MobilitySection map init error", e);
      }
    })();
    return () => { alive = false; };
  }, [mapsApiKey]);

  // 2. Draw Circles & Markers when data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = window.google;
    if (!g?.maps) return;

    // Clear old elements
    markersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current.forEach((c) => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    const map = mapRef.current;
    
    // Valid Hotels check
    const validHotels = (hotels || []).filter(h => h && typeof h.lat === "number" && typeof h.lng === "number");

    if (!validHotels.length) {
        // If no hotels, center on a default or world view? Or just leave as is.
        // Usually good to have a fallback, but we show a warning message in UI instead.
        return;
    }

    const bounds = new g.maps.LatLngBounds();

    validHotels.forEach((h, idx) => {
      const pos = { lat: h.lat, lng: h.lng };
      bounds.extend(pos);

      // Marker
      const marker = new g.maps.Marker({
        position: pos,
        map,
        title: h.name || `Location ${idx + 1}`,
        icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#FF385C",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
        }
      });
      markersRef.current.push(marker);

      // Circles (Isochrone estimation)
      const modesToDraw = transport.length ? transport : ["public_transit"];
      modesToDraw.forEach((modeId) => {
        const km = kmRadiusFrom(modeId, selectedMinutes);
        if (!km) return;

        const circle = new g.maps.Circle({
          map,
          center: pos,
          radius: kmToMeters(km),
          strokeColor: "#35505c",
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: "#35505c",
          fillOpacity: 0.08,
          clickable: false,
        });
        circlesRef.current.push(circle);
      });
    });

    map.fitBounds(bounds);
    
    // Avoid too much zoom if only 1 point
    if (validHotels.length === 1) {
        const listener = g.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 14) map.setZoom(14);
            g.maps.event.removeListener(listener);
        });
    }

  }, [mapReady, hotels, transport, selectedMinutes]);

  const rangeLabel = useMemo(() => RANGES.find((x) => x.id === comfortRange)?.label || "Up to 30 min", [comfortRange]);
  const hasHotels = (hotels || []).some((h) => typeof h?.lat === "number");

  return (
    <Card>
      <SectionHeader
        icon={<MapPin className="w-5 h-5" />}
        title="Mobility & Movement"
        subtitle="Visualize your daily reach from your accommodation."
      />

      {!hasHotels && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 flex gap-3 text-orange-800">
           <MapPin className="w-5 h-5 shrink-0" />
           <div className="text-sm">
             <p className="font-bold">No location set</p>
             <p>Please go back to the <strong>Accommodation</strong> step and add a hotel or general area to see your mobility map.</p>
           </div>
        </div>
      )}

      {/* Map Preview */}
      <div className="mb-8 overflow-hidden rounded-[18px] border border-[#DDDDDD] bg-white relative">
        <div ref={mapDivRef} className="h-[320px] w-full bg-gray-50" />
        
        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 text-[12px] text-[#717171] shadow-sm">
          <div className="flex justify-between items-center">
             <span className="font-semibold text-[#222]">Range: {rangeLabel}</span>
             <span className="text-xs">Based on transport speed</span>
          </div>
        </div>
      </div>

      {/* Transport Selection */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Preferred Transport
        </label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <PillButton
                key={m.id}
                active={transport.includes(m.id)}
                onClick={() => toggleMode(m.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      {/* Range Selection */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Daily Travel Comfort Range
        </label>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <PillButton
              key={r.id}
              active={comfortRange === r.id}
              onClick={() => onChange({ ...value, comfortRange: r.id })}
            >
              {r.label}
            </PillButton>
          ))}
        </div>
      </div>

      <Field label="Mobility Notes">
        <ControlShell className="bg-white">
          <textarea
            rows={2}
            value={value.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="e.g. Avoid stairs, need wheelchair access..."
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </ControlShell>
      </Field>
    </Card>
  );
}