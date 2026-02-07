import React, { useEffect } from "react";
import { Card } from "./primitives";

export default function TransitionScreen({ title = "Got it.", subtitle, onDone, ms = 650 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), ms);
    return () => clearTimeout(t);
  }, [onDone, ms]);

  return (
    <Card className="flex items-center justify-between gap-6">
      <div>
        <div className="text-[22px] font-semibold tracking-[-0.02em] text-slate-900">{title}</div>
        {subtitle ? <div className="mt-1 text-[14px] text-slate-600">{subtitle}</div> : null}
      </div>
      <div className="h-10 w-10 rounded-full bg-slate-900/5 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
      </div>
    </Card>
  );
}
