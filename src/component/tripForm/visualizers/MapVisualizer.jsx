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
    <div className="h-full w-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <div className="text-[12px] font-bold uppercase text-slate-500 tracking-wider">
          Google Maps
        </div>
        <div className="mt-1 text-[16px] font-semibold text-slate-900">
          {label || "Map"}
        </div>
        <div className="mt-1 text-[13px] text-slate-600 truncate">
          {safeQuery}
        </div>
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

        {markers.length > 1 ? (
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-lg">
            <div className="text-xs text-slate-500 mb-1">Route</div>
            <div className="flex flex-wrap gap-1 text-[13px] text-slate-800">
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
