// src/sections/PreferencesSection.jsx
import React, { useState } from "react";
import { Heart, Mountain, Castle, Compass, Sparkles, Star, Coffee, Camera } from "lucide-react";
import { Card, SectionHeader, PillButton, Field, ControlShell } from "../../ui/primitives";

const TAGS = [
  { id: "nature", label: "Nature", icon: Mountain },
  { id: "city", label: "City life", icon: Castle },
  { id: "history", label: "History", icon: Compass },
  { id: "adventure", label: "Adventure", icon: Sparkles },
  { id: "nightlife", label: "Nightlife", icon: Star },
  { id: "relaxation", label: "Relaxation", icon: Coffee },
  { id: "photography", label: "Photography", icon: Camera },
];

export default function PreferencesSection({ value, onChange }) {
  const [focus, setFocus] = useState(false);

  const tags = value.tags || [];
  const text = value.text || "";

  const toggle = (id) => {
    const next = tags.includes(id) ? tags.filter((x) => x !== id) : [...tags, id];
    onChange({ ...value, tags: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<Heart className="w-5 h-5" />}
        title="Your travel style"
        subtitle="Pick interests and add a short description."
        right={
          <div className="text-right">
            <div className="text-[12px] text-slate-500">Interests</div>
            <div className="text-[18px] font-semibold text-slate-900">{tags.length}</div>
          </div>
        }
      />

      <div className="mb-6">
        <div className="text-[13px] font-semibold text-slate-900">Interests</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const Icon = t.icon;
            const active = tags.includes(t.id);
            return (
              <PillButton key={t.id} active={active} onClick={() => toggle(t.id)} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {t.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <Field label="Describe your perfect trip" hint="More detail = better recommendations">
        <ControlShell focused={focus} className="bg-white">
          <textarea
            rows={4}
            value={text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="Example: hidden cafes, sunrise hikes, local markets, calm parks…"
            className="w-full bg-transparent outline-none text-[14px] text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
          />
          <div className="mt-2 text-[12px] text-slate-500">{text.length}/500</div>
        </ControlShell>
      </Field>

      {(tags.length || text) ? (
        <div className="mt-6 rounded-[16px] border border-slate-200 bg-white p-4">
          <div className="text-[13px] font-semibold text-slate-900">Summary</div>
          {tags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((id) => {
                const t = TAGS.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <span key={id} className="px-3 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-[13px]">
                    {t.label}
                  </span>
                );
              })}
            </div>
          ) : null}
          {text ? <div className="mt-3 text-[13px] text-slate-600">{text}</div> : null}
        </div>
      ) : null}
    </Card>
  );
}
