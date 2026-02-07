import React, { useEffect, useState } from "react";

const MESSAGES = [
  "Nice start.",
  "Great choice.",
  "Noted.",
  "Let's keep going.",
  "Interesting...",
  "Got it."
];

export default function TransitionScreen({ onDone, customMessage }) {
  const [opacity, setOpacity] = useState(0);
  const [message] = useState(() => customMessage || MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setOpacity(1));
    
    // Wait, then trigger done
    const t = setTimeout(() => {
      setOpacity(0);
      setTimeout(onDone, 300); // Wait for fade out
    }, 1200); // Duration of message

    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#F7F7F7]"
      style={{ opacity, transition: "opacity 300ms ease-in-out" }}
    >
      <div className="text-center">
        <h2 className="font-serif text-[40px] text-[#222] mb-2 transform translate-y-0 animate-pulse">
            {message}
        </h2>
        <div className="h-1 w-16 bg-[#FF385C] mx-auto rounded-full" />
      </div>
    </div>
  );
}