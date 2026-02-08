import React from "react";
import { Luggage, MapPin, Shield, Utensils, Wallet } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";

export default function GuideTab({
  guideLoading,
  guideError,
  guideCompanion,
  guidePacking,
  guideFoodMissions,
  guideMoney,
  guideSafety,
  guideEtiquette,
  guideBookingStrategy,
  guideHiddenGems,
}) {
  return (
    <Card>
      <SectionHeader
        icon={<Shield className="h-5 w-5" />}
        title="Guide Companion"
        subtitle="Expert-level travel intelligence from your latest itinerary and profile."
        right={
          guideLoading ? (
            <div className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
              Refreshing...
            </div>
          ) : null
        }
      />

      {guideError ? (
        <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
          {guideError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8a92]">
              Concierge Headline
            </div>
            <div className="mt-1 text-[15px] font-bold text-[#2f4954]">
              {guideCompanion?.headline ||
                "Guide companion is preparing your next-level travel brief."}
            </div>
            <div className="mt-2 text-[12px] leading-relaxed text-[#5f7078]">
              {guideCompanion?.destinationSummary ||
                "Generate or refresh your trip plan to unlock personalized local context, etiquette, and safety suggestions."}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
              <Luggage className="h-4 w-4" />
              Packing Checklist
            </div>
            <div className="mt-3 space-y-2">
              {(guidePacking.length
                ? guidePacking
                : ["No packing checklist yet."]
              ).map((item, idx) => (
                <div
                  key={`packing_${idx}_${item}`}
                  className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#2f4954]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
              <Utensils className="h-4 w-4" />
              Food Missions
            </div>
            <div className="mt-3 space-y-2">
              {(guideFoodMissions.length
                ? guideFoodMissions
                : [{ dish: "No food missions yet.", whereToTry: "" }]
              ).map((item, idx) => (
                <div
                  key={`food_${idx}_${item.dish}`}
                  className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                >
                  <div className="text-[12px] font-semibold text-[#2f4954]">
                    {item.dish}
                  </div>
                  {item.whereToTry ? (
                    <div className="mt-0.5 text-[12px] text-[#5f7078]">
                      {item.whereToTry}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#2f4954]">
              <Wallet className="h-4 w-4" />
              Money Intelligence
            </div>
            <div className="mt-3 space-y-2">
              {(guideMoney.length ? guideMoney : ["No money guidance yet."]).map(
                (item, idx) => (
                  <div
                    key={`money_${idx}_${item}`}
                    className="rounded-2xl border border-[#ece2d4] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#2f4954]">
              Safety & Etiquette
            </div>
            <div className="mt-3 space-y-2">
              {(guideSafety.length ? guideSafety : ["No safety checklist yet."]).map(
                (item, idx) => (
                  <div
                    key={`safety_${idx}_${item}`}
                    className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#2f4954]"
                  >
                    {item}
                  </div>
                )
              )}
              {(guideEtiquette.length
                ? guideEtiquette
                : ["No local etiquette notes yet."]
              ).map((item, idx) => (
                <div
                  key={`etiquette_${idx}_${item}`}
                  className="rounded-2xl border border-[#ece2d4] bg-white px-3 py-2 text-[12px] text-[#2f4954]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#2f4954]">
              Booking Strategy
            </div>
            <div className="mt-3 space-y-2">
              {(guideBookingStrategy.length
                ? guideBookingStrategy
                : [{ item: "No booking strategy yet.", why: "", bestTime: "" }]
              ).map((item, idx) => (
                <div
                  key={`booking_${idx}_${item.item}`}
                  className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                >
                  <div className="text-[12px] font-semibold text-[#2f4954]">
                    {item.item}
                  </div>
                  {item.why ? (
                    <div className="mt-0.5 text-[12px] text-[#5f7078]">
                      {item.why}
                    </div>
                  ) : null}
                  {item.bestTime ? (
                    <div className="mt-0.5 text-[11px] font-semibold text-[#0b5b57]">
                      Best time: {item.bestTime}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#2f4954]">Hidden Gems</div>
            <div className="mt-3 space-y-2">
              {(guideHiddenGems.length
                ? guideHiddenGems
                : [
                    {
                      name: "No hidden gem suggestions yet.",
                      whyVisit: "",
                      mapUrl: "",
                    },
                  ]
              ).map((item, idx) => (
                <div
                  key={`gem_${idx}_${item.name}`}
                  className="rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2"
                >
                  <div className="text-[12px] font-semibold text-[#2f4954]">
                    {item.name}
                  </div>
                  {item.whyVisit ? (
                    <div className="mt-0.5 text-[12px] text-[#5f7078]">
                      {item.whyVisit}
                    </div>
                  ) : null}
                  {item.mapUrl ? (
                    <a
                      href={item.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2f4954] hover:border-[#d9c5aa]"
                    >
                      <MapPin className="h-3 w-3" />
                      Open map
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
