// src/ui/tokens.js
export const ui = {
  radius: {
    card: "rounded-[30px]",
    control: "rounded-[20px]",
    pill: "rounded-full",
  },
  shadow: {
    card: "shadow-[0_30px_80px_rgba(17,30,40,0.12)]",
    soft: "shadow-[0_16px_44px_rgba(17,30,40,0.10)]",
  },
  border: {
    hairline: "border border-[var(--line)]",
    focus: "ring-4 ring-[#0c5f5c26] border-[#2f6d67]",
  },
  surface: {
    page: "bg-transparent",
    card: "bg-[var(--surface)]",
    tint: "bg-[var(--surface-soft)]",
  },
  text: {
    title:
      "font-display text-[26px] sm:text-[34px] font-semibold tracking-[-0.03em] text-[var(--ink)] leading-[1.05]",
    subtitle: "text-[15px] text-[var(--ink-soft)] leading-relaxed",
    label: "text-[11px] font-semibold text-[#39505a] tracking-[0.12em] uppercase",
    helper: "text-[12px] text-[var(--ink-muted)]",
  },
};
