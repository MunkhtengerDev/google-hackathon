import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

const MESSAGES = [
  "Nice start.",
  "Great choice.",
  "Noted.",
  "Let's keep going.",
  "Interesting...",
  "Got it.",
];

export default function TransitionScreen({
  onDone,
  customMessage,
  persist = false,
}) {
  const [opacity, setOpacity] = useState(0);
  const fallbackMessage = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    []
  );
  const message = customMessage || fallbackMessage;

  useEffect(() => {
    requestAnimationFrame(() => setOpacity(1));

    if (persist) return () => {};

    let doneTimeout;
    const fadeTimeout = setTimeout(() => {
      setOpacity(0);
      doneTimeout = setTimeout(() => onDone?.(), 300);
    }, 1200);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(doneTimeout);
    };
  }, [onDone, persist]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#F7F7F7]"
      style={{ opacity, transition: "opacity 300ms ease-in-out" }}
    >
      <div className="text-center">
        <h2 className="mb-2 transform translate-y-0 font-serif text-[40px] text-[#222] animate-pulse">
          {message}
        </h2>
        {persist ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#edc9d0] bg-white px-4 py-2 text-[13px] font-semibold text-[#6a3c45] shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <div className="mx-auto h-1 w-16 rounded-full bg-[#FF385C]" />
        )}
      </div>
    </div>
  );
}
