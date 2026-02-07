import React from "react";
import { Sparkles, Coffee, Mountain, BookOpen, PartyPopper } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell } from "../../ui/primitives";

const GOALS = [
  { id: "relax", label: "Relax & Disconnect", icon: Coffee },
  { id: "explore", label: "Explore Deeply", icon: Mountain },
  { id: "learn", label: "Learn Something", icon: BookOpen },
  { id: "celebrate", label: "Celebrate", icon: PartyPopper },
];

export default function ExperienceSection({ value, onChange }) {
  const toggleGoal = (id) => {
    const curr = value.goals || [];
    const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
    onChange({ ...value, goals: next });
  };

  return (
    <Card>
      <SectionHeader
        icon={<Sparkles className="w-5 h-5 text-amber-500" />}
        title="Experience Goals"
        subtitle="This helps the AI build a narrative for your trip."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {GOALS.map((g) => {
          const Icon = g.icon;
          return (
            <PillButton
              key={g.id}
              active={value.goals?.includes(g.id)}
              onClick={() => toggleGoal(g.id)}
            >
              <Icon className="w-3 h-3 mr-2" />
              {g.label}
            </PillButton>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">One Sentence Goal</label>
        <ControlShell className="bg-white">
          <textarea
            rows={3}
            value={value.narrative}
            onChange={(e) => onChange({ ...value, narrative: e.target.value })}
            placeholder="I want this trip to feel like..."
            className="w-full bg-transparent outline-none text-sm text-slate-900 resize-none placeholder:text-slate-400"
          />
        </ControlShell>
        <div className="text-xs text-slate-500">🔥 This becomes the core narrative anchor for the itinerary.</div>
      </div>
    </Card>
  );
}