import React from "react";

export default function ResponsePlanEmptyState({ title, subtitle }) {
  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
      <div className="max-w-md">
        <div className="text-[14px] font-bold text-[#2f4954]">{title}</div>
        <div className="mt-1 text-[12px] leading-relaxed text-[#6a7b84]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
