// src/sections/BudgetSection.jsx
import React, { useMemo, useState } from "react";
import { DollarSign, ChevronDown } from "lucide-react";
import { Card, SectionHeader, Field, ControlShell, ThinProgress } from "../../ui/primitives";

const CURRENCY_META = {
  USD: { symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  GBP: { symbol: "£", name: "British Pound", flag: "🇬🇧" },
  MNT: { symbol: "₮", name: "Mongolian Tögrög", flag: "🇲🇳" },
  JPY: { symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  KRW: { symbol: "₩", name: "Korean Won", flag: "🇰🇷" },
  CNY: { symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  CAD: { symbol: "$", name: "Canadian Dollar", flag: "🇨🇦" },
  AUD: { symbol: "$", name: "Australian Dollar", flag: "🇦🇺" },
};

const FX_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  MNT: 3450,
  JPY: 150,
  KRW: 1330,
  CNY: 7.2,
  CAD: 1.35,
  AUD: 1.52,
};

function usdToLocal(usd, currency) {
  return (usd || 0) * (FX_RATES[currency] ?? 1);
}

function formatMoney(amount, currency) {
  const meta = CURRENCY_META[currency] || { symbol: "", name: currency, flag: "🌍" };
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = safe >= 100 ? Math.round(safe) : Math.round(safe * 100) / 100;
  return `${meta.symbol}${rounded.toLocaleString()}`;
}

export default function BudgetSection({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);

  const localBudget = useMemo(() => usdToLocal(value.usdBudget || 0, value.currency), [value.usdBudget, value.currency]);
  const localSavings = useMemo(() => usdToLocal(value.usdSavings || 0, value.currency), [value.usdSavings, value.currency]);

  const coverage = useMemo(() => {
    if (!value.usdBudget || !value.usdSavings) return null;
    return Math.min(100, (value.usdSavings / value.usdBudget) * 100);
  }, [value.usdBudget, value.usdSavings]);

  const options = Object.keys(CURRENCY_META);

  return (
    <Card>
      <SectionHeader
        icon={<DollarSign className="w-5 h-5" />}
        title="Budget & currency"
        subtitle="Enter amounts in USD. We’ll convert instantly to your preferred currency."
        right={
          coverage !== null ? (
            <div className="text-right">
              <div className="text-[12px] text-slate-500">Coverage</div>
              <div className="text-[18px] font-semibold text-slate-900">{Math.round(coverage)}%</div>
            </div>
          ) : null
        }
      />

      <div className="relative mb-6">
        <Field label="Preferred currency">
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 flex items-center justify-between hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-[18px]">{CURRENCY_META[value.currency]?.flag ?? "🌍"}</div>
              <div className="text-left">
                <div className="text-[14px] font-semibold text-slate-900">{value.currency}</div>
                <div className="text-[12px] text-slate-500">{CURRENCY_META[value.currency]?.name ?? ""}</div>
              </div>
            </div>
            <ChevronDown className={["w-4 h-4 text-slate-500 transition-transform", open ? "rotate-180" : ""].join(" ")} />
          </button>

          {open ? (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <div className="max-h-64 overflow-auto p-2">
                {options.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, currency: code });
                      setOpen(false);
                    }}
                    className="w-full rounded-[12px] px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[18px]">{CURRENCY_META[code].flag}</div>
                      <div className="text-left">
                        <div className="text-[13px] font-medium text-slate-900">{code}</div>
                        <div className="text-[12px] text-slate-500">{CURRENCY_META[code].name}</div>
                      </div>
                    </div>
                    {value.currency === code ? <div className="h-2 w-2 rounded-full bg-slate-900" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Trip budget (USD)" hint={`Local: ${formatMoney(localBudget, value.currency)}`}>
          <ControlShell focused={focus === "budget"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-slate-400 text-[18px] font-semibold">$</div>
              <input
                type="number"
                min="0"
                value={value.usdBudget || ""}
                onChange={(e) => onChange({ ...value, usdBudget: Number(e.target.value) || 0 })}
                onFocus={() => setFocus("budget")}
                onBlur={() => setFocus(null)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[18px] font-semibold text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </ControlShell>
        </Field>

        <Field label="Available savings (USD)" hint={`Local: ${formatMoney(localSavings, value.currency)}`}>
          <ControlShell focused={focus === "savings"} className="bg-white">
            <div className="flex items-center gap-3">
              <div className="text-slate-400 text-[18px] font-semibold">$</div>
              <input
                type="number"
                min="0"
                value={value.usdSavings || ""}
                onChange={(e) => onChange({ ...value, usdSavings: Number(e.target.value) || 0 })}
                onFocus={() => setFocus("savings")}
                onBlur={() => setFocus(null)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-[18px] font-semibold text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </ControlShell>
        </Field>
      </div>

      {coverage !== null ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12px] text-slate-600">Savings progress</div>
            <div className="text-[12px] font-semibold text-slate-900">{Math.round(coverage)}% covered</div>
          </div>
          <ThinProgress value={coverage} />
          <div className="mt-2 text-[12px] text-slate-500">
            {coverage >= 100 ? "You’re fully funded — nice." : "We’ll match suggestions to your budget."}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
