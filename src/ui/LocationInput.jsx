import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "../lib/googleMapsLoader"; 
// Ensure your googleMapsLoader is correctly imported

export default function LocationInput({
  label,
  value = [],
  onChange,
  onContextData, // Callback to pass extra data (like which country a city belongs to)
  placeholder = "Search...",
  apiKey,
  max = 10,
  types = [], // Google Maps Autocomplete types: ['country'] or ['(cities)']
}) {
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);
  const acRef = useRef(null);

  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const canAdd = useMemo(() => {
    const t = input.trim();
    return !!t && !items.includes(t) && items.length < max;
  }, [input, items, max]);

  // Handle adding text manually or via selection
  const handleAdd = (text, placeDetails = null) => {
    const finalTxt = (text || input).trim();
    if (!finalTxt) return;
    if (items.includes(finalTxt)) return;
    
    // Pass metadata up if available (e.g. City -> Country mapping)
    if (placeDetails && onContextData) {
      onContextData(finalTxt, placeDetails);
    }

    onChange([...items, finalTxt]);
    setInput("");
  };

  const removeItem = (t) => onChange(items.filter((x) => x !== t));

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!apiKey) return;
        const g = await loadGoogleMaps(apiKey);
        if (!alive) return;
        if (!g?.maps?.places || !inputRef.current) return;

        // Initialize Autocomplete with specific types (cities vs regions vs geocode)
        const options = {
          fields: ["formatted_address", "name", "address_components"],
          types: types.length ? types : undefined, 
        };

        const ac = new g.maps.places.Autocomplete(inputRef.current, options);

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          // Prefer name for cities/countries, formatted_address fallback
          const text = place?.name || place?.formatted_address; 
          if (text) handleAdd(text, place);
        });

        acRef.current = ac;
        setReady(true);
      } catch (e) {
        console.error("Maps load error", e);
        setReady(false);
      }
    })();

    return () => {
      alive = false;
      if (acRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(acRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, types]);

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12px] font-bold uppercase tracking-wider text-[#60727b]">
          {label}
        </label>
        <span className="text-[10px] font-medium text-[#a0b0b9]">
          {items.length}/{max}
        </span>
      </div>

      {/* Input Shell */}
      <div className="relative flex items-center rounded-xl border border-[#d8ccb8] bg-white px-3 py-2.5 transition focus-within:border-[#0c5f5c] focus-within:ring-1 focus-within:ring-[#0c5f5c]">
        <MapPin className="mr-2 h-4 w-4 text-[#aab6bc]" />
        
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canAdd) handleAdd();
            }
          }}
          disabled={!ready && !!apiKey} // Disable briefly while maps loads
          placeholder={!ready && apiKey ? "Loading maps..." : placeholder}
          className="w-full bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[#aab6bc]"
        />

        <button
          type="button"
          onClick={() => handleAdd()}
          disabled={!canAdd}
          className={`ml-2 rounded-lg p-1.5 transition ${
            canAdd
              ? "bg-[#fff6e8] text-[#35505c] hover:bg-[#ffecc7]"
              : "cursor-not-allowed text-gray-300"
          }`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Chips / Pills Area */}
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((t) => (
            <span
              key={t}
              className="inline-flex animate-in fade-in zoom-in duration-200 items-center gap-1.5 rounded-full bg-[#0d6a66] py-1 pl-3 pr-1.5 text-[12px] font-medium text-white shadow-sm"
            >
              {t}
              <button
                type="button"
                onClick={() => removeItem(t)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 hover:bg-white/40"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}