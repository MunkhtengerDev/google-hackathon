import React, { useMemo } from "react";
import { Calendar as CalendarIcon, ExternalLink } from "lucide-react";

function toYMD(dateStr) {
  // expects YYYY-MM-DD
  return (dateStr || "").replaceAll("-", "");
}

export default function CalendarVisualizer({ startDate, endDate, title = "Trip", details = "", location = "" }) {
  const link = useMemo(() => {
    if (!startDate) return null;

    const end = endDate || startDate;

    // For all-day events, Google end date is exclusive → +1 day
    const endObj = new Date(end);
    endObj.setDate(endObj.getDate() + 1);
    const endExclusive = endObj.toISOString().slice(0, 10);

    const dates = `${toYMD(startDate)}/${toYMD(endExclusive)}`;

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", title);
    url.searchParams.set("dates", dates);
    if (details) url.searchParams.set("details", details);
    if (location) url.searchParams.set("location", location);
    return url.toString();
  }, [startDate, endDate, title, details, location]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#dfd3bf] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[#e4d8c4] bg-[#f9f2e5] p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#5c6f78]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5c6f78]">
            Google Calendar
          </span>
        </div>

        <div className="mt-2 text-[16px] font-semibold text-[var(--ink)]">
          {startDate || "Select start"} <span className="mx-2 text-[#bba88f]">→</span>{" "}
          {endDate || "Select end"}
        </div>

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0c5f5c] to-[#0a4d4a] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_10px_22px_rgba(12,95,92,0.24)]"
          >
            Add to Google Calendar <ExternalLink className="w-4 h-4" />
          </a>
        ) : null}
      </div>

      <div className="flex-1 p-6">
        <div className="rounded-2xl border border-[#dfd3bf] bg-[#fff8eb] p-5">
          <div className="text-[13px] font-semibold text-[#2b4652]">Deep note</div>
          <div className="mt-1 text-[13px] text-[#51656f]">
            This method is intentionally robust: it works for every user without OAuth.
            If you want direct calendar insertion with permissions, add Google OAuth later.
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#dfd3bf] bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#60727b]">
            Date snapshot
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] text-[#425863]">
            <span className="rounded-full bg-[#ecf7f4] px-3 py-1 font-semibold text-[#0d6a66]">
              {startDate || "Start TBD"}
            </span>
            <span>to</span>
            <span className="rounded-full bg-[#fff1dc] px-3 py-1 font-semibold text-[#956233]">
              {endDate || "End TBD"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
