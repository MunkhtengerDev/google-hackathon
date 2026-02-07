import React from "react";
import { ui } from "./tokens";

export function Card({ children, className = "" }) {
  return (
    <section
      className={[
        "motion-rise",
        "relative overflow-hidden",
        ui.surface.card,
        ui.radius.card,
        ui.border.hairline,
        ui.shadow.card,
        "p-5 sm:p-7 backdrop-blur-[2px]",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/75 to-transparent" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function SectionHeader({ icon, title, subtitle, right }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#0d6a66] via-[#0c5f5c] to-[#084744] text-white shadow-[0_12px_24px_rgba(12,95,92,0.32)]">
            {icon}
          </div>
          <h2 className={ui.text.title}>{title}</h2>
        </div>
        {subtitle ? <p className={[ui.text.subtitle, "mt-2"].join(" ")}>{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Field({ label, hint, right, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {label ? <div className={ui.text.label}>{label}</div> : null}
          {hint ? <div className={[ui.text.helper, "mt-1"].join(" ")}>{hint}</div> : null}
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
        "px-4 py-3 transition-all duration-200",
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
        "px-4 py-2 text-[13px] font-semibold transition-all duration-200 select-none hover:-translate-y-[1px]",
        active
          ? "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_10px_20px_rgba(12,95,92,0.30)]"
          : "border border-[var(--line)] bg-white text-[#31454f] hover:border-[var(--line-strong)] hover:bg-[#fff9ef]",
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
        "group w-full text-left",
        "p-5 sm:p-6",
        "rounded-[22px] border transition-all duration-200",
        active
          ? "border-transparent bg-gradient-to-br from-[#0f706c] via-[#0b5a58] to-[#084744] text-white shadow-[0_20px_40px_rgba(12,95,92,0.32)]"
          : "border-[var(--line)] bg-[#fffdf9] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-white hover:shadow-[0_16px_34px_rgba(15,23,42,0.11)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={[
              "h-12 w-12 rounded-[16px] flex items-center justify-center",
              active ? "bg-white/14" : "bg-[#f8efdc] text-[#35505a] group-hover:bg-[#f5e6ca]",
            ].join(" ")}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div
              className={[
                "text-[16px] font-semibold tracking-[-0.01em]",
                active ? "text-white" : "text-[var(--ink)]",
              ].join(" ")}
            >
              {title}
            </div>
            {description ? (
              <div
                className={[
                  "mt-1 text-[13px] leading-relaxed",
                  active ? "text-white/85" : "text-[var(--ink-soft)]",
                ].join(" ")}
              >
                {description}
              </div>
            ) : null}
          </div>
        </div>
        {meta ? (
          <div className={["text-[12px] font-semibold", active ? "text-white/85" : "text-[#60717a]"].join(" ")}>
            {meta}
          </div>
        ) : null}
      </div>
    </button>
  );
}
