import React from "react";
import { Brain, Camera, CloudSun, Loader2, MapPin } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";
import ResponsePlanEmptyState from "./ResponsePlanEmptyState";

export default function TimelineTab({
  timelineStops,
  isResolvingPhotos,
  featuredTimelineStop,
  timelineDayTabs,
  activeTimelineDayId,
  onSelectTimelineDay,
  photoResolutionByStop,
  featuredPlaceDetails,
  weatherByPlaceId,
  featuredDayWeatherFallback,
}) {
  return (
    <Card>
      <SectionHeader
        icon={<Brain className="h-5 w-5" />}
        title="Itinerary Timeline"
        subtitle="Day-by-day navigation with places to visit and direct map links."
        right={
          <div className="flex flex-wrap items-center gap-2">
            {isResolvingPhotos ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcf] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Finding relevant photos...
              </div>
            ) : null}
            <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
              Stops: {timelineStops.length}
            </div>
          </div>
        }
      />

      {featuredTimelineStop ? (
        <div className="rounded-[28px] border border-[#dce2ee] bg-[#f5f7fb] p-5 sm:p-8">
          <div className="text-center">
            <h3 className="font-display text-[36px] leading-none text-[#16213f] sm:text-[52px]">
              <span className="text-[#2554d9]">YOUR</span> TRIP TIMELINE
            </h3>
            <p className="mt-2 text-[12px] text-[#637487]">
              Select a day to review the schedule, key stops, and accurate map
              links.
            </p>
          </div>

          <div className="mt-7 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-7 border-b border-[#d7deec] px-1">
              {timelineDayTabs.map((dayTab) => (
                <button
                  key={`timeline_day_${dayTab.id}`}
                  type="button"
                  onClick={() => onSelectTimelineDay(dayTab.id)}
                  className={[
                    "relative pb-3 text-[17px] font-semibold transition",
                    activeTimelineDayId === dayTab.id
                      ? "text-[#2554d9]"
                      : "text-[#5f6c7a] hover:text-[#2f4954]",
                  ].join(" ")}
                >
                  {dayTab.label}
                  {activeTimelineDayId === dayTab.id ? (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2554d9]" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8deeb] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f6c7a]">
                {featuredTimelineStop.label}
                <span>•</span>
                <span>{featuredTimelineStop.place}</span>
              </div>
              <h4 className="text-[33px] font-bold leading-tight text-[#2554d9]">
                {featuredTimelineStop.headline}
              </h4>
              <p className="text-[15px] leading-relaxed text-[#203344]">
                {featuredTimelineStop.detail}
              </p>

              <div className="rounded-2xl border border-[#d5dbeb] bg-white px-3.5 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#607389]">
                  Places To Visit On {featuredTimelineStop.label}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {featuredTimelineStop.placesToVisit?.slice(0, 4).map((spot) => (
                    <a
                      key={spot.id}
                      href={spot.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-[#f8fbff] px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {spot.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={featuredTimelineStop.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open in Google Maps
                </a>
                <a
                  href={featuredTimelineStop.streetViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Street View
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-[22px] border border-[#dce2ee] bg-white shadow-[0_20px_36px_rgba(30,43,74,0.10)]">
                <img
                  src={
                    photoResolutionByStop[featuredTimelineStop.photoKey]
                      ?.imageUrl || featuredTimelineStop.imageUrl
                  }
                  alt={featuredTimelineStop.place}
                  loading="lazy"
                  className="h-[20rem] w-full object-cover sm:h-[28rem]"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = featuredTimelineStop.fallbackImageUrl;
                  }}
                />
              </div>
            </div>
          </div>

          {featuredPlaceDetails.length ? (
            <div className="mt-8 rounded-[22px] border border-[#dbe2f0] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#637487]">
                  Detailed Places For {featuredTimelineStop.label}
                </div>
                <div className="rounded-full border border-[#d9e1ef] bg-[#f8fbff] px-2.5 py-1 text-[10px] font-bold text-[#445e79]">
                  {featuredPlaceDetails.length} stops
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {featuredPlaceDetails.map((spot) => (
                  <div
                    key={spot.id}
                    className="rounded-[18px] border border-[#dce3f0] bg-[#f9fbff] px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#60748a]">
                          Stop {String(spot.order).padStart(2, "0")}
                        </div>
                        <div className="mt-1 text-[16px] font-bold leading-snug text-[#2a3f62]">
                          {spot.name}
                        </div>
                      </div>
                      <div className="rounded-full border border-[#d5deec] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4b6481]">
                        {spot.category}
                      </div>
                    </div>

                    <div className="mt-2 text-[12px] leading-relaxed text-[#495f79]">
                      {spot.summary}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                          Best Time
                        </div>
                        <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                          {spot.bestTime}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                          Suggested Stay
                        </div>
                        <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                          {spot.duration}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-[#63788f]">
                        <CloudSun className="h-3.5 w-3.5" />
                        Approx Weather
                      </div>
                      <div className="mt-0.5 text-[12px] font-semibold text-[#2c415f]">
                        {weatherByPlaceId[spot.id] || featuredDayWeatherFallback}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#d8e1ef] bg-white px-2.5 py-2 text-[11px] leading-relaxed text-[#4a6079]">
                      <span className="font-semibold text-[#354e6a]">
                        Planning tip:
                      </span>{" "}
                      {spot.tip}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={spot.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Open map
                      </a>
                      <a
                        href={spot.streetViewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d5dbeb] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#233955] hover:border-[#b8c5dd]"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Street View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <ResponsePlanEmptyState
          title="Timeline is empty"
          subtitle="Generate a plan to populate day-by-day timeline details."
        />
      )}
    </Card>
  );
}
