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
                className="w-full bg-transparent outline-none font-semibold text-slate-900"
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
              className="w-full bg-transparent outline-none"
              placeholder="USD"
            />
          </ControlShell>
        </Field>
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Budget Priority</div>
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
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-sm font-semibold mb-2">Spending style</div>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="style"
                checked={value.spendingStyle === "track"}
                onChange={() => onChange({ ...value, spendingStyle: "track" })}
              />
              Track every cost
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="style"
                checked={value.spendingStyle === "relaxed"}
                onChange={() => onChange({ ...value, spendingStyle: "relaxed" })}
              />
              Relaxed
            </label>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
