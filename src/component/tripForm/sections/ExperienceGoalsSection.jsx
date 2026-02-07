import React from "react";
import { Flag, Smile, Zap, Book, Users } from "lucide-react";
import { Card, SectionHeader, PillButton, ControlShell, Field } from "../../../ui/primitives";

const GOALS = [
  { id: "relax", label: "Relax & Disconnect", icon: Smile },
  { id: "explore", label: "Explore Deeply", icon: Flag },
  { id: "adventure", label: "Adventure", icon: Zap },
  { id: "learn", label: "Learn Something", icon: Book },
  { id: "connect", label: "Connect with People", icon: Users },
];

export default function ExperienceGoalsSection({ value, onChange }) {
  const selected = value.experienceGoals || [];

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    onChange({ ...value, experienceGoals: next });
  };

  return (
    <Card>
      <SectionHeader title="Experience Goals" subtitle="What is the purpose of this trip?" />

      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const Icon = g.icon;
            return (
              <PillButton
                key={g.id}
                active={selected.includes(g.id)}
                onClick={() => toggle(g.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {g.label}
              </PillButton>
            );
          })}
        </div>
      </div>

      <Field label="One Sentence Goal" hint="Finish the sentence: 'I want this trip to feel like...'">
        <ControlShell className="bg-white">
          <textarea
            rows={3}
            value={value.oneSentenceGoal || ""}
            onChange={(e) => onChange({ ...value, oneSentenceGoal: e.target.value })}
            placeholder="e.g. A slow, romantic escape where we ignore our phones."
            className="w-full bg-transparent outline-none text-xl font-serif text-gray-900 placeholder:text-gray-300 resize-none"
          />
        </ControlShell>
      </Field>
      
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800">
        ✨ <strong>AI Tip:</strong> This sentence is the "Soul" of your itinerary. We use it to rewrite descriptions and prioritize events.
      </div>
    </Card>
  );
}