import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, MapPin } from "lucide-react";
import { ControlShell, Field, PillButton } from "./primitives";
import { loadGoogleMaps } from "../lib/googleMapsLoader";

export default function LocationInput({
  label,
  hint,
  value = [],
  onChange,
  placeholder = "Search and press Enter…",
  apiKey,
  onFocusQuery,
  max = 10,
}) {
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const acRef = useRef(null);

  const items = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const canAdd = useMemo(() => {
    const t = input.trim();
    return !!t && !items.includes(t) && items.length < max;
  }, [input, items, max]);

  const addItem = (t) => {
    const txt = (t || input).trim();
    if (!txt) return;
    if (items.includes(txt)) return;
    if (items.length >= max) return;
    onChange([...items, txt]);
    setInput("");
    onFocusQuery?.(txt);
  };

  const removeItem = (t) => onChange(items.filter((x) => x !== t));

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const g = await loadGoogleMaps(apiKey);
        if (!alive) return;
        if (!g?.maps?.places || !inputRef.current) return;

        const ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "name"],
        });

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const text = place?.formatted_address || place?.name || inputRef.current.value;
          if (text) addItem(text);
        });

        acRef.current = ac;
        setReady(true);
      } catch {
        setReady(false);
      }
    })();

    return () => {
      alive = false;
      acRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <Field
      label={label}
      hint={hint}
      right={
        <div className="rounded-full border border-[#d8ccb8] bg-[#fff8eb] px-2 py-0.5 text-[11px] font-semibold text-[#60727b]">
          {items.length}/{max}
        </div>
      }
    >
      <ControlShell focused={focused} className="bg-white">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#6d7c84]" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onFocusQuery?.(e.target.value);
            }}
            onFocus={() => {
              setFocused(true);
              onFocusQuery?.(input || items[items.length - 1] || "");
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canAdd) addItem();
              }
            }}
            placeholder={ready ? placeholder : "Type a place (autocomplete disabled)…"}
            className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[#819199]"
          />
          <button
            type="button"
            onClick={() => canAdd && addItem()}
            className="rounded-xl border border-[#d8ccb8] bg-[#fff6e8] p-2 text-[#35505c] transition hover:border-[#cabca6] hover:bg-[#ffefd4]"
            aria-label="Add"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {items.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0c5f5c] to-[#0a4d4a] py-1.5 pl-3 pr-2 text-[13px] text-white"
              >
                {t}
                <button type="button" onClick={() => removeItem(t)} className="text-white/80 hover:text-amber-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {items.length > 1 ? (
          <div className="mt-3">
            <PillButton active={false} onClick={() => onFocusQuery?.(items.join(" → "))}>
              Preview route on map
            </PillButton>
          </div>
        ) : null}
      </ControlShell>
    </Field>
  );
}
