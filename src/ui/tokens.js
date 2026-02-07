// src/ui/tokens.js
export const ui = {
  radius: {
    card: "rounded-[24px]",
    control: "rounded-[16px]",
    pill: "rounded-full",
  },
  shadow: {
    card: "shadow-[0_16px_40px_rgba(15,23,42,0.08)]",
    soft: "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
  },
  border: {
    hairline: "border border-slate-200/70",
    focus: "ring-4 ring-slate-900/10 border-slate-300",
  },
  surface: {
    page: "bg-[#FAFAF9]", // Airbnb-ish warm off-white
    card: "bg-white",
    tint: "bg-slate-50/60",
  },
  text: {
    title: "text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] text-slate-900",
    subtitle: "text-[15px] text-slate-600 leading-relaxed",
    label: "text-[12px] font-semibold text-slate-700 tracking-[-0.01em]",
    helper: "text-[12px] text-slate-500",
  },
};
