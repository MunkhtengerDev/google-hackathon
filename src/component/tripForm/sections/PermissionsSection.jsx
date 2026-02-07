import React from "react";
import { Check } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";

export default function PermissionsSection({ value, onChange }) {
  
  const toggle = (key) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const ITEMS = [
    { key: "allowAltDestinations", label: "Suggest alternative destinations", desc: "If we find cheaper/better spots nearby." },
    { key: "allowBudgetOptimize", label: "Optimize budget automatically", desc: "Swap hotels/activities to fit your limit." },
    { key: "allowDailyAdjust", label: "Adjust plan daily", desc: "Allow dynamic changing based on weather." },
    { key: "allowSaveForFuture", label: "Save preferences for future", desc: "Remember your diet & style for next time." },
  ];

  return (
    <Card>
      <SectionHeader title="AI Permissions" subtitle="How much control should the AI have?" />

      <div className="space-y-4">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => toggle(item.key)}
            className={`
              w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all
              ${value[item.key] 
                ? "border-black bg-gray-50" 
                : "border-gray-100 bg-white"
              }
            `}
          >
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-lg">{item.label}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>

            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
              ${value[item.key] ? "bg-black border-black" : "border-gray-300 bg-transparent"}
            `}>
              {value[item.key] && <Check className="w-4 h-4 text-white" />}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}