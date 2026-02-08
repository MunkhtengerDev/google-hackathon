import React from "react";
import { Wallet } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";

export default function WalletTab({ budgetItems }) {
  return (
    <Card>
      <SectionHeader
        icon={<Wallet className="h-5 w-5" />}
        title="Wallet"
        subtitle="Budget breakdown + currency (connect to your currency conversion logic)."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[22px] border border-[#e8dcc8] bg-white">
            <div className="border-b border-[#eee3d2] bg-[#fffaf1] px-4 py-3">
              <div className="text-[12px] font-bold text-[#2f4954]">
                Budget Allocation
              </div>
              <div className="mt-0.5 text-[12px] text-[#6a7b84]">
                Parsed from "Budget Allocation" section.
              </div>
            </div>

            <div className="p-4">
              {budgetItems.length ? (
                <div className="space-y-2">
                  {budgetItems.map((budget, idx) => (
                    <div
                      key={`${budget.label}_${idx}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                    >
                      <div className="text-[12px] font-semibold text-[#2f4954]">
                        {budget.label}
                      </div>
                      <div className="text-[12px] font-bold text-[#0b5b57]">
                        {budget.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-[#6a7b84]">
                  Couldn’t parse "Budget Allocation" yet. Keep the raw section
                  available in "All Sections".
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
            <div className="text-[12px] font-bold text-[#2f4954]">
              Wallet Tools
            </div>
            <div className="mt-1 text-[12px] text-[#6a7b84]">
              Add currency conversion, spend tracking, and alerts.
            </div>

            <div className="mt-4 space-y-2">
              {[
                "Convert home currency → destination currency",
                "Daily spending limit suggestions",
                "Track hotels / tickets / activities",
                "Overspend risk alerts",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#eadfcf] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
