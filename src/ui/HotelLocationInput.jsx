import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, MapPin } from "lucide-react";
import { loadGoogleMaps } from "../lib/googleMapsLoader";

// Each item stored as:
// { id: place_id, name, address, lat, lng }
export default function HotelLocationInput({
  label = "Hotel Locations",
  value = [],
  onChange,
  placeholder = "Search hotels / stays...",
  apiKey,
  max = 5,
}) {
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);
  const acRef = useRef(null);

  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const canAdd = useMemo(() => {
    const t = input.trim();
    return !!t && items.length < max;
  }, [input, items.length, max]);

  const removeItem = (id) => onChange(items.filter((x) => x.id !== id));

  const addPlace = (place) => {
    const placeId = place?.place_id;
    const name = place?.name || place?.formatted_address || input.trim();
    const address = place?.formatted_address || "";
    const lat = place?.geometry?.location?.lat?.();
    const lng = place?.geometry?.location?.lng?.();

    if (!placeId || typeof lat !== "number" || typeof lng !== "number") return;

    // no duplicates by place_id
    if (items.some((x) => x.id === placeId)) {
      setInput("");
      return;
    }

    onChange([
      ...items,
      {
        id: placeId,
        name,
        address,
        lat,
        lng,
      },
    ]);
    setInput("");
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!apiKey) return;
        const g = await loadGoogleMaps(apiKey);
        if (!alive) return;
        if (!g?.maps?.places || !inputRef.current) return;

        const ac = new g.maps.places.Autocomplete(inputRef.current, {
          // lodging works well for hotels/airbnbs; still allow broad fallback
          types: ["lodging"],
          fields: ["place_id", "name", "formatted_address", "geometry"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          addPlace(place);
        });

        acRef.current = ac;
        setReady(true);
      } catch (e) {
        console.error("HotelLocationInput maps load error", e);
        setReady(false);
      }
    })();

    return () => {
      alive = false;
      try {
        if (acRef.current && window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(acRef.current);
        }
      } catch {}
    };
  }, [apiKey]);

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12px] font-bold uppercase tracking-wider text-[#717171]">
          {label}
        </label>
        <span className="text-[10px] font-medium text-[#a0b0b9]">
          {items.length}/{max}
        </span>
      </div>

      <div className="relative flex items-center rounded-[12px] border border-[#DDDDDD] bg-white px-3 py-2.5 transition focus-within:border-black focus-within:shadow-[0_0_0_1px_black]">
        <MapPin className="mr-2 h-4 w-4 text-[#aab6bc]" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!ready && !!apiKey}
          placeholder={!ready && apiKey ? "Loading maps..." : placeholder}
          className="w-full bg-transparent text-[14px] text-[#222] outline-none placeholder:text-[#aab6bc]"
        />

        <button
          type="button"
          onClick={() => setInput("")}
          disabled={!canAdd}
          className={`ml-2 rounded-lg p-1.5 transition ${
            canAdd ? "bg-[#F7F7F7] text-[#222]" : "cursor-not-allowed text-gray-300"
          }`}
          title="Use autocomplete to add a hotel"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#DDDDDD] bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#222]">{h.name}</div>
                {h.address ? (
                  <div className="truncate text-[12px] text-[#717171]">{h.address}</div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removeItem(h.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F7F7] hover:bg-[#EFEFEF]"
              >
                <X className="h-4 w-4 text-[#222]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
