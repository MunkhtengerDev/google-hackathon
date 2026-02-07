import React, { useMemo } from "react";

export default function MapVisualizer({ query, label, markers = [], apiKey }) {
  const safeQuery = (query || "").trim() || "World";

  const src = useMemo(() => {
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        apiKey
      )}&q=${encodeURIComponent(safeQuery)}`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      safeQuery
    )}&t=&z=5&ie=UTF8&iwloc=&output=embed`;
  }, [apiKey, safeQuery]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#dfd3bf] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[#e4d8c4] bg-[#f9f2e5] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5b6d76]">
            Google Maps
          </div>
          {markers.length ? (
            <div className="rounded-full border border-[#d8ccb8] bg-[#fff7ea] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#60727b]">
              {markers.length} Stops
            </div>
          ) : null}
        </div>
        <div className="mt-1 text-[16px] font-semibold text-[var(--ink)]">{label || "Map"}</div>
        <div className="mt-1 truncate text-[13px] text-[#566973]">{safeQuery}</div>
      </div>

      <div className="flex-1 relative">
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          frameBorder="0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={src}
          className="absolute inset-0"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#ffffffdc] to-transparent" />

        {markers.length > 1 ? (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-[#ddd0bc] bg-[#fffdf9e8] p-3 shadow-lg backdrop-blur">
            <div className="mb-1 text-xs font-semibold text-[#546871]">Route</div>
            <div className="flex flex-wrap gap-1 text-[13px] text-[#2b434f]">
              {markers.map((m, i) => (
                <span key={i}>
                  {m}
                  {i < markers.length - 1 ? " → " : ""}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
