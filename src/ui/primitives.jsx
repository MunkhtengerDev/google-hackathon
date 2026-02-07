import React from "react";

// Visual Design Tokens (Airbnb/Lemonade Style)
export const ui = {
  layout: {
    centered: "max-w-2xl mx-auto",
    split: "grid grid-cols-1 lg:grid-cols-12 gap-8 h-full",
  },
  surface: {
    base: "bg-[#F7F7F7]", // Light grey background like Airbnb
    card: "bg-white",
    input: "bg-white",
  },
  text: {
    display: "font-serif text-[32px] sm:text-[40px] leading-[1.1] font-medium text-[#222222]",
    body: "font-sans text-[16px] leading-relaxed text-[#717171]",
    label: "font-sans text-[12px] font-bold uppercase tracking-wider text-[#717171]",
  },
  shadow: {
    soft: "shadow-[0_6px_16px_rgba(0,0,0,0.08)]",
    floating: "shadow-[0_16px_32px_rgba(0,0,0,0.12)]",
  },
  radius: {
    card: "rounded-[24px]",
    button: "rounded-full",
    input: "rounded-[12px]",
  },
  animation: {
    fade: "transition-opacity duration-500",
    slide: "transition-transform duration-500 ease-out",
  }
};

export function Card({ children, className = "" }) {
  return (
    <div
      className={`
        ${ui.surface.card}
        ${ui.radius.card}
        ${ui.shadow.soft}
        p-8 sm:p-10
        border border-gray-100
        overflow-visible min-w-0
        ${className}
      `}
    >
      {children}
    </div>
  );
}


export function SectionHeader({ icon, title, subtitle, right }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-3 min-w-0 overflow-visible">
        {/* Left */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon ? (
              <div className="shrink-0 text-[#35505c]">{icon}</div>
            ) : null}

            <h2 className={`${ui.text.display} min-w-0 truncate`}>
              {title}
            </h2>
          </div>

          {subtitle ? (
            <p className="mt-3 text-[18px] text-[#717171] max-w-lg">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Right */}
        {right ? (
          <div className="shrink-0 overflow-visible">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {right}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Field({ label, children, right }) {
  return (
    <div className="group mb-6">
      <div className="flex items-baseline justify-between mb-2">
        {label && <label className={ui.text.label}>{label}</label>}
        {right && <div>{right}</div>}
      </div>
      {children}
    </div>
  );
}

export function ControlShell({ children, focused, className = "" }) {
  return (
    <div
      className={`
        relative flex items-center
        ${ui.surface.input} 
        ${ui.radius.input} 
        border-[1px] 
        transition-all duration-300
        p-4
        ${focused 
          ? "border-black shadow-[0_0_0_1px_black]" 
          : "border-[#DDDDDD] hover:border-[#B0B0B0]"
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Lemonade/Wealthfront style big selection cards
export function OptionCard({ active, onClick, title, description, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left p-6 transition-all duration-300
        ${ui.radius.input}
        border-[2px]
        ${active
          ? "border-[#FF385C] bg-[#FFF0F3]" // Airbnb/Lemonade Accent (Red/Pinkish) or Teal
          : "border-[#DDDDDD] bg-white hover:border-[#B0B0B0]"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon Circle */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg
          ${active ? "bg-[#FF385C] text-white" : "bg-[#F7F7F7] text-[#222]"}
        `}>
          {icon}
        </div>
        <div>
          <div className={`text-[18px] font-semibold ${active ? "text-[#FF385C]" : "text-[#222]"}`}>
            {title}
          </div>
          <div className="text-[14px] text-[#717171] mt-1 leading-normal">
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

export function PillButton({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-6 py-3 text-[14px] font-semibold transition-all duration-200 transform
        ${ui.radius.button}
        ${active
          ? "bg-[#222222] text-white scale-105 shadow-md"
          : "bg-white border border-[#DDDDDD] text-[#222] hover:border-black"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}