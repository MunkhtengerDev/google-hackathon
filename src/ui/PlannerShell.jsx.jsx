// src/ui/PlannerShell.jsx
import React from "react";
import { ThinProgress } from "./primitives";
import { ui } from "./tokens";

export default function PlannerShell({ stepIndex, stepsCount, title, children }) {
  const pct = Math.round(((stepIndex + 1) / stepsCount) * 100);

  return (
    <div className={["min-h-screen", ui.surface.page].join(" ")}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] text-slate-600">
              Step {stepIndex + 1} of {stepsCount}
            </div>
            <div className="text-[13px] font-semibold text-slate-900">{pct}%</div>
          </div>
          <ThinProgress value={pct} />
          {title ? (
            <div className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-slate-900">
              {title}
            </div>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
