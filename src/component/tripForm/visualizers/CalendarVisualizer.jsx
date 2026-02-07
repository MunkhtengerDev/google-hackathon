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
    <div className="h-full w-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-500" />
          <span className="text-[12px] font-bold uppercase text-slate-500 tracking-wider">
            Google Calendar
          </span>
        </div>

        <div className="mt-2 text-[16px] font-semibold text-slate-900">
          {startDate || "Select start"} <span className="text-slate-300 mx-2">→</span>{" "}
          {endDate || "Select end"}
        </div>

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-medium"
          >
            Add to Google Calendar <ExternalLink className="w-4 h-4" />
          </a>
        ) : null}
      </div>

      <div className="flex-1 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-[13px] font-semibold text-slate-900">Deep note</div>
          <div className="mt-1 text-[13px] text-slate-600">
            This method is intentionally robust: it works for every user without OAuth.
            If you want direct calendar insertion with permissions, add Google OAuth later.
          </div>
        </div>
      </div>
    </div>
  );
}
