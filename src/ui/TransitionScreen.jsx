import React, { useEffect } from "react";
import { Card } from "./primitives";

export default function TransitionScreen({ title = "Got it.", subtitle, onDone, ms = 650 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), ms);
    return () => clearTimeout(t);
  }, [onDone, ms]);

  return (
    <Card className="flex items-center justify-between gap-6 bg-gradient-to-br from-[#fffdf9] via-[#fff8eb] to-[#f2e6cf]">
      <div>
        <div className="font-display text-[36px] leading-[0.95] text-[var(--ink)]">{title}</div>
        {subtitle ? <div className="mt-1 text-[14px] text-[var(--ink-soft)]">{subtitle}</div> : null}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0c5f5c12]">
        <div className="h-2.5 w-2.5 rounded-full bg-[#0c5f5c] animate-pulse" />
      </div>
    </Card>
  );
}
