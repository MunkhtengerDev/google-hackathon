import React from "react";
import { Utensils, Leaf, Coffee, Wine, ChefHat, Ban } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";

const DIETS = [
  { id: "local", label: "Local Cuisine", icon: ChefHat },
  { id: "street", label: "Street Food", icon: Utensils },
  { id: "fine_dining", label: "Fine Dining", icon: Wine },
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Leaf },
  { id: "halal", label: "Halal", icon: Coffee }, // using Coffee as placeholder
  { id: "seafood", label: "Seafood Lover", icon: Utensils },
  { id: "no_preference", label: "No Preference", icon: Utensils },
];

const IMPORTANCE_LEVELS = [
  { id: "main", label: "Main Reason for Travel 🍜", desc: "I plan my day around meals." },
  { id: "nice", label: "Nice to Have", desc: "Good food is a bonus." },
  { id: "not_important", label: "Fuel Only", desc: "I just need to eat to survive." },
];

export default function FoodSection({ value, onChange }) {
  const diets = value.diet || [];

  const toggleDiet = (id) => {
    let next;
    if (id === "no_preference") {
      next = ["no_preference"];
    } else {
      const withoutNoPref = diets.filter((d) => d !== "no_preference");
      next = withoutNoPref.includes(id) 
        ? withoutNoPref.filter((d) => d !== id) 
        : [...withoutNoPref, id];
    }
    onChange({ ...value, diet: next });
  };

  return (
    <Card>
      <SectionHeader
        title="Food & Dining"
        subtitle="How important is food to your trip?"
      />

      {/* Importance Level */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Food Priority
        </label>
        <div className="grid grid-cols-1 gap-3">
          {IMPORTANCE_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => onChange({ ...value, importance: level.id })}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all
                ${value.importance === level.id 
                  ? "border-black bg-gray-50" 
                  : "border-gray-100 bg-white hover:border-gray-200"
                }
              `}
            >
              <div className="font-semibold text-gray-900">{level.label}</div>
              <div className="text-sm text-gray-500">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diet Selection */}
      <div className="mb-8">
        <label className="block text-[12px] font-bold uppercase tracking-wider text-gray-500 mb-3">
          Preferences & Restrictions
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => {
            const Icon = d.icon;
            const active = diets.includes(d.id);
            return (
              <PillButton
                key={d.id}
                active={active}
                onClick={() => toggleDiet(d.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {d.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      {/* Free Text Notes */}
      <Field label="Allergies or Specific Notes">
        <ControlShell className="bg-white">
          <textarea
            rows={3}
            value={value.notes || ""}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="e.g. Severe peanut allergy, love spicy food..."
            className="w-full bg-transparent outline-none text-base text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </ControlShell>
      </Field>
    </Card>
  );
}