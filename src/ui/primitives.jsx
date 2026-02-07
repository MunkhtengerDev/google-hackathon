// src/ui/primitives.jsx
import React from "react";
import { ui } from "./tokens";

export function Card({ children, className = "" }) {
  return (
    <section
      className={[
        ui.surface.card,
        ui.radius.card,
        ui.border.hairline,
        ui.shadow.card,
        "p-5 sm:p-7",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function SectionHeader({ icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-[16px] bg-slate-900 text-white flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <h2 className={ui.text.title}>{title}</h2>
        </div>
        {subtitle && <p className={[ui.text.subtitle, "mt-2"].join(" ")}>{subtitle}</p>}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

// Care/of vibe: thin, elegant progress
export function ThinProgress({ value = 0 }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="h-[6px] rounded-full bg-slate-200/70 overflow-hidden">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-700"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

export function Field({ label, hint, right, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {label && <div className={ui.text.label}>{label}</div>}
          {hint && <div className={[ui.text.helper, "mt-1"].join(" ")}>{hint}</div>}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function ControlShell({ focused, children, className = "" }) {
  return (
    <div
      className={[
        ui.radius.control,
        ui.border.hairline,
        ui.surface.tint,
        "px-4 py-3 transition-all",
        focused ? ui.border.focus : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function PillButton({ active, children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        ui.radius.pill,
        "px-4 py-2 text-[13px] font-medium transition-all select-none",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white border border-slate-200/80 text-slate-700 hover:border-slate-300",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function OptionCard({ active, onClick, title, description, icon, meta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left w-full",
        "p-5 sm:p-6",
        "rounded-[20px] border transition-all",
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_16px_36px_rgba(15,23,42,0.20)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={[
              "h-12 w-12 rounded-[16px] flex items-center justify-center",
              active ? "bg-white/10" : "bg-slate-100",
            ].join(" ")}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className={["text-[16px] font-semibold tracking-[-0.01em]", active ? "text-white" : "text-slate-900"].join(" ")}>
              {title}
            </div>
            {description && (
              <div className={["mt-1 text-[13px] leading-relaxed", active ? "text-white/80" : "text-slate-600"].join(" ")}>
                {description}
              </div>
            )}
          </div>
        </div>
        {meta ? (
          <div className={["text-[12px] font-medium", active ? "text-white/80" : "text-slate-500"].join(" ")}>
            {meta}
          </div>
        ) : null}
      </div>
    </button>
  );
}
