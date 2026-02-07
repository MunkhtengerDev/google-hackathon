import React, { useState } from "react";
import { Compass, Sparkles } from "lucide-react";

export default function PlannerShell({
  children,
  rightContent,
  title,
  subtitle,
  stepIndex,
  stepsCount,
  onReset,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const progress = Math.round(((stepIndex + 1) / stepsCount) * 100);

  return (
    <div className="min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="motion-rise mb-6 overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/90 p-5 shadow-[0_20px_50px_rgba(16,28,38,0.10)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d5c6ae] bg-[#fff6e7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#576972]">
                <Sparkles className="h-3.5 w-3.5 text-[#b56a2c]" />
                Your Travel Buddy
              </div>
              <h1 className="font-display mt-3 truncate text-[34px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-[#d8cab2] bg-[#fff8eb] px-3 py-2 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6c7d86]">
                  Completion
                </div>
                <div className="text-[18px] font-bold text-[#0a4d4a]">
                  {progress}%
                </div>
              </div>

              {onReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb] sm:inline-flex"
                >
                  Reset
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowPreview((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb] lg:hidden"
              >
                <Compass className="h-3.5 w-3.5" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-[#5f717a]">
              <span>
                Step {stepIndex + 1} of {stepsCount}
              </span>
              <span>Journey Progress</span>
            </div>
            <div className="h-[10px] overflow-hidden rounded-full bg-[#e6dbc7]">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#b56a2c] via-[#0f706c] to-[#084744] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-[#0f706c]" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-5">{children}</section>

          {showPreview ? (
            <section className="motion-rise h-[460px] overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.09)] lg:hidden">
              <div className="h-full overflow-hidden rounded-[20px] border border-[#e5d9c6] bg-white">
                {rightContent}
              </div>
            </section>
          ) : null}

          <aside className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-7 h-[700px] overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)]/82 p-3 shadow-[0_30px_70px_rgba(16,28,38,0.12)] backdrop-blur">
              <div className="h-full overflow-hidden rounded-[24px] border border-[#e4d8c4] bg-white">
                {rightContent}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
