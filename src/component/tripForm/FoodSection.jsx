// src/sections/FoodSection.jsx
import React, { useState } from "react";
import { Utensils, Leaf, Wheat, Fish, Milk, Sparkles, Plus, ChefHat } from "lucide-react";
import { Card, SectionHeader, PillButton, Field, ControlShell } from "../../ui/primitives";

const FOOD_TYPES = [
  { id: "local", label: "Local cuisine", icon: ChefHat },
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Leaf },
  { id: "halal", label: "Halal", icon: Sparkles },
  { id: "kosher", label: "Kosher", icon: Wheat },
  { id: "no_restrictions", label: "No restrictions", icon: Utensils },
];

const COMMON = [
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Seafood allergy",
  "Spicy food lover",
  "Sweet tooth",
  "Coffee enthusiast",
  "Wine tasting",
];

export default function FoodSection({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");

  const types = value.types || [];
  const otherText = value.otherText || "";

  const toggleType = (id) => {
    if (id === "no_restrictions") {
      onChange({ ...value, types: ["no_restrictions"], otherText: "" });
      return;
    }
    const clean = types.filter((t) => t !== "no_restrictions");
    const next = clean.includes(id) ? clean.filter((x) => x !== id) : [...clean, id];
    onChange({ ...value, types: next });
  };

  const toggleCommon = (pref) => {
    const arr = otherText ? otherText.split(", ").filter(Boolean) : [];
    const next = arr.includes(pref) ? arr.filter((x) => x !== pref) : [...arr, pref];
    onChange({ ...value, otherText: next.join(", ") });
  };

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    const arr = otherText ? otherText.split(", ").filter(Boolean) : [];
    if (!arr.includes(t)) {
      onChange({ ...value, otherText: [...arr, t].join(", ") });
    }
    setCustom("");
    setShowCustom(false);
  };

  return (
    <Card>
      <SectionHeader
        icon={<Utensils className="w-5 h-5" />}
        title="Food preferences"
        subtitle="Tell us what you like (and what to avoid)."
        right={
          <div className="text-right">
            <div className="text-[12px] text-slate-500">Selected</div>
            <div className="text-[18px] font-semibold text-slate-900">{types.length}</div>
          </div>
        }
      />

      <div className="mb-6">
        <div className="text-[13px] font-semibold text-slate-900">Dietary types</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOOD_TYPES.map((t) => {
            const Icon = t.icon;
            const active = types.includes(t.id);
            return (
              <PillButton
                key={t.id}
                active={active}
                onClick={() => toggleType(t.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold text-slate-900">Common preferences</div>
          <button
            type="button"
            onClick={() => setShowCustom((s) => !s)}
            className="text-[12px] text-slate-600 hover:text-slate-900 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add custom
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {COMMON.map((p) => (
            <PillButton key={p} active={otherText.includes(p)} onClick={() => toggleCommon(p)}>
              {p}
            </PillButton>
          ))}
        </div>
      </div>

      {showCustom ? (
        <div className="mb-6">
          <Field label="Custom preference">
            <ControlShell focused className="bg-white">
              <div className="flex gap-2">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  placeholder="e.g., lactose intolerance"
                  className="w-full bg-transparent outline-none text-[14px] text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="px-4 py-2 rounded-[12px] bg-slate-900 text-white text-[13px] font-medium"
                >
                  Add
                </button>
              </div>
            </ControlShell>
          </Field>
        </div>
      ) : null}

      {otherText ? (
        <div className="rounded-[16px] border border-slate-200 bg-white p-4">
          <div className="text-[13px] font-semibold text-slate-900">Your notes</div>
          <div className="mt-1 text-[13px] text-slate-600">{otherText}</div>
        </div>
      ) : null}
    </Card>
  );
}
