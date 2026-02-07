import React from "react";
import { Wallet } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, PillButton } from "../../../ui/primitives";

export default function BudgetSection({ tripStatus, value, onChange }) {
  const PRIORITIES = [
    { id: "comfort", label: "Comfort" },
    { id: "balance", label: "Balance" },
    { id: "cheapest", label: "Cheapest Possible" },
    { id: "once", label: "Once in a Lifetime" },
  ];

  return (
    <Card>
      <SectionHeader
        icon={<Wallet className="w-5 h-5" />}
        title={tripStatus === "booked" ? "Budget Execution" : "Budget Intelligence"}
        subtitle="Help us optimize your trip costs."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Field label="Total Budget (USD)">
          <ControlShell className="bg-white">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                value={value.usdBudget || ""}
                onChange={(e) => onChange({ ...value, usdBudget: Number(e.target.value) })}
                className="w-full bg-transparent font-semibold text-slate-900 outline-none placeholder:text-[#83939b]"
                placeholder="2000"
              />
            </div>
          </ControlShell>
        </Field>

        <Field label="Currency (for display)">
          <ControlShell className="bg-white">
            <input
              value={value.currency || "USD"}
              onChange={(e) => onChange({ ...value, currency: e.target.value })}
              className="w-full bg-transparent outline-none placeholder:text-[#83939b]"
              placeholder="USD"
            />
          </ControlShell>
        </Field>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-sm font-semibold">Budget Priority</div>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <PillButton
              key={p.id}
              active={value.priority === p.id}
              onClick={() => onChange({ ...value, priority: p.id })}
            >
              {p.label}
            </PillButton>
          ))}
        </div>
      </div>

      {tripStatus === "booked" ? (
        <div className="rounded-[16px] border border-[#ddd0bc] bg-[#fff7e9] p-4">
          <div className="text-sm font-semibold mb-2">Spending style</div>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="style"
                checked={value.spendingStyle === "track"}
                onChange={() => onChange({ ...value, spendingStyle: "track" })}
                className="accent-[#0c5f5c]"
              />
              Track every cost
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="style"
                checked={value.spendingStyle === "relaxed"}
                onChange={() => onChange({ ...value, spendingStyle: "relaxed" })}
                className="accent-[#0c5f5c]"
              />
              Relaxed
            </label>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[18px] border border-[#d9ccb7] bg-[#fff7e9] p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#60727b]">
          Budget insight
        </div>
        <p className="mt-1 text-[13px] text-[#556871]">
          Choosing a priority helps the planner decide where to save and where
          to spend for maximum trip quality.
        </p>
      </div>
    </Card>
  );
}
