import React, { useState } from "react";

export default function PlannerShell({ children, rightContent, title, stepIndex, stepsCount, onReset }) {
  const [showPreview, setShowPreview] = useState(false);
  const progress = ((stepIndex + 1) / stepsCount) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans flex justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-wider text-slate-500 font-bold">
                  Trip Planner
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 truncate">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onReset ? (
                  <button
                    type="button"
                    onClick={onReset}
                    className="hidden sm:inline-flex px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-50"
                  >
                    Reset
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowPreview((s) => !s)}
                  className="lg:hidden px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold"
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
              </div>
            </div>

            <div className="mt-4 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-2 text-[12px] text-slate-500">
              Step {stepIndex + 1} of {stepsCount}
            </div>
          </div>

          <div className="relative">{children}</div>

          {/* Mobile preview */}
          {showPreview ? <div className="lg:hidden mt-6 h-[420px]">{rightContent}</div> : null}
        </div>

        {/* RIGHT */}
        <div className="hidden lg:col-span-7 lg:block sticky top-8 h-[640px]">
          {rightContent}
        </div>
      </div>
    </div>
  );
}
