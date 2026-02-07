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
  const inputRef = useRef(null);
  const acRef = useRef(null);

  const items = Array.isArray(value) ? value : [];

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
    <Field label={label} hint={hint} right={<div className="text-[12px] text-slate-500">{items.length}/{max}</div>}>
      <ControlShell className="bg-white">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onFocusQuery?.(e.target.value);
            }}
            onFocus={() => onFocusQuery?.(input || items[items.length - 1] || "")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canAdd) addItem();
              }
            }}
            placeholder={ready ? placeholder : "Type a place (autocomplete disabled)…"}
            className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => canAdd && addItem()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
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
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-900 text-white text-[13px]"
              >
                {t}
                <button type="button" onClick={() => removeItem(t)} className="text-white/80 hover:text-red-200">
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
