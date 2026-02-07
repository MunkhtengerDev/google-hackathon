import React from "react";
import { Users, User, Baby } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, PillButton } from "../../ui/primitives";

export default function GroupSection({ value, onChange }) {
  const TYPES = ["Solo", "Couple", "Family", "Group"];

  return (
    <Card>
      <SectionHeader
        icon={<Users className="w-5 h-5" />}
        title="Who is traveling?"
        subtitle="We adapt the pace and activities based on the group."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {TYPES.map((t) => (
          <PillButton
            key={t}
            active={value.type === t.toLowerCase()}
            onClick={() => onChange({ ...value, type: t.toLowerCase() })}
          >
            {t}
          </PillButton>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Adults">
          <ControlShell className="bg-white">
            <input
              type="number" min="1"
              value={value.adults}
              onChange={(e) => onChange({...value, adults: Number(e.target.value)})}
              className="w-full bg-transparent outline-none text-slate-900"
            />
          </ControlShell>
        </Field>
        <Field label="Children">
          <ControlShell className="bg-white">
            <input
              type="number" min="0"
              value={value.children}
              onChange={(e) => onChange({...value, children: Number(e.target.value)})}
              className="w-full bg-transparent outline-none text-slate-900"
            />
          </ControlShell>
        </Field>
      </div>
      
      {value.children > 0 && (
         <div className="mt-4">
           <Field label="Children Ages" hint="Comma separated (e.g. 5, 8, 12)">
             <ControlShell className="bg-white">
                <input 
                  value={value.ages}
                  onChange={(e) => onChange({...value, ages: e.target.value})}
                  className="w-full bg-transparent outline-none text-slate-900"
                />
             </ControlShell>
           </Field>
         </div>
      )}
    </Card>
  );
}