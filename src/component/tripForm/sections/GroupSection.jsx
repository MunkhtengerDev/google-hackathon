import React from "react";
import { User, Users, Baby, Heart } from "lucide-react";
import { Card, SectionHeader, ControlShell, Field } from "../../../ui/primitives";

const TYPES = [
  { id: "solo", label: "Solo", icon: User, defaultCount: 1 },
  { id: "couple", label: "Couple", icon: Heart, defaultCount: 2 },
  { id: "family", label: "Family", icon: Baby, defaultCount: 3 },
  { id: "friends", label: "Friends/Group", icon: Users, defaultCount: 4 },
];

export default function GroupSection({ value, onChange }) {
  const isFamily = value.who === "family";
  
  const handleTypeSelect = (typeObj) => {
    // Automatically set reasonable defaults when type changes
    onChange({ 
        ...value, 
        who: typeObj.id,
        totalPeople: typeObj.defaultCount,
        adults: typeObj.id === 'couple' ? 2 : typeObj.id === 'solo' ? 1 : value.adults 
    });
  };

  return (
    <Card>
      <SectionHeader title="Group Composition" subtitle="Who is coming along?" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = value.who === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTypeSelect(t)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2
                ${active ? "border-black bg-gray-50" : "border-gray-100 bg-white hover:border-gray-200"}
              `}
            >
              <Icon className={`w-6 h-6 ${active ? "text-black" : "text-gray-400"}`} />
              <span className="font-semibold text-sm">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Total People">
          <ControlShell className="bg-white">
            <input
              type="number"
              min="1"
              value={value.totalPeople || 1}
              onChange={(e) => onChange({ ...value, totalPeople: Number(e.target.value) })}
              className="w-full bg-transparent outline-none font-semibold"
            />
          </ControlShell>
        </Field>

        {isFamily && (
          <Field label="Children Count">
             <ControlShell className="bg-white">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-transparent outline-none font-semibold"
                  // Bind this to your actual state if you have a field for child count
                />
             </ControlShell>
          </Field>
        )}
      </div>
     
      {isFamily && (
        <p className="mt-4 text-sm text-gray-500 bg-orange-50 p-3 rounded-lg border border-orange-100">
          We will prioritize family-friendly hotels and pacing.
        </p>
      )}
    </Card>
  );
}