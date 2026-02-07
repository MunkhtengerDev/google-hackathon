// src/sections/PlanningInsightsSection.jsx
import React, { useMemo, useState } from "react";
import { Sparkles, Plane, Hotel, FileText, Globe, TrendingDown, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Card, SectionHeader, PillButton } from "../../ui/primitives";

export default function PlanningInsightsSection({ destination, budget, dates }) {
  const [tab, setTab] = useState("overview");
  const place = [destination?.city, destination?.country].filter(Boolean).join(", ") || "your destination";

  // lightweight mock insights; replace with your real AI later
  const insights = useMemo(() => {
    const total = Number(budget?.usdBudget || 0);
    const days = Number(dates?.durationDays || 7) || 7;

    return {
      flights: {
        bestTime: "6–8 weeks before travel",
        priceTrend: "trending down",
        avgPrice: total ? `~$${Math.round(total * 0.3).toLocaleString()}` : "$500–900",
        tips: ["Track prices", "Fly mid-week", "Stay flexible"],
      },
      hotels: {
        avgPrice: total ? `~$${Math.round((total * 0.4) / days).toLocaleString()}/night` : "$100–150/night",
        bestAreas: ["Central", "Near transit", "Walkable districts"],
        rating: "4.2+ recommended",
      },
      visa: {
        required: destination?.country ? "Possibly (depends on passport)" : "Check destination",
        processingTime: "2–4 weeks",
        cost: "$50–200",
      },
      culture: {
        tipping: destination?.country === "USA" ? "15–20%" : "5–10%",
        dressCode: "Moderate",
        language: "Learn basic greetings",
      },
    };
  }, [destination?.country, budget?.usdBudget, dates?.durationDays]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "flights", label: "✈️ Flights" },
    { id: "accommodation", label: "🏨 Stay" },
    { id: "visa", label: "📄 Visa" },
    { id: "culture", label: "🎭 Culture" },
  ];

  return (
    <Card>
      <SectionHeader
        icon={<Sparkles className="w-5 h-5" />}
        title="Travel insights"
        subtitle={`Smart planning tips for ${place}.`}
        right={
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-slate-50/60">
            <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
            <span className="text-[12px] font-medium text-slate-700">Live insights</span>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <PillButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </PillButton>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <Plane className="w-4 h-4" /> Flights
            </div>
            <div className="mt-2 text-[13px] text-slate-600">Book: {insights.flights.bestTime}</div>
            <div className="mt-1 text-[13px] text-slate-600">Avg: {insights.flights.avgPrice}</div>
            <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-700">
              <TrendingDown className="w-4 h-4" /> {insights.flights.priceTrend}
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <Hotel className="w-4 h-4" /> Stay
            </div>
            <div className="mt-2 text-[13px] text-slate-600">Avg: {insights.hotels.avgPrice}</div>
            <div className="mt-1 text-[13px] text-slate-600">Rating: {insights.hotels.rating}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.hotels.bestAreas.map((a) => (
                <span key={a} className="px-3 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-[12px]">
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <FileText className="w-4 h-4" /> Visa
            </div>
            <div className="mt-2 text-[13px] text-slate-600">Required: {insights.visa.required}</div>
            <div className="mt-1 text-[13px] text-slate-600">Time: {insights.visa.processingTime}</div>
            <div className="mt-1 text-[13px] text-slate-600">Cost: {insights.visa.cost}</div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <Globe className="w-4 h-4" /> Culture
            </div>
            <div className="mt-2 text-[13px] text-slate-600">Tipping: {insights.culture.tipping}</div>
            <div className="mt-1 text-[13px] text-slate-600">Dress: {insights.culture.dressCode}</div>
            <div className="mt-1 text-[13px] text-slate-600">{insights.culture.language}</div>
          </div>
        </div>
      ) : null}

      {tab === "flights" ? (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-slate-900">Booking window</div>
            <div className="mt-1 text-[14px] text-slate-600">{insights.flights.bestTime}</div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <CheckCircle className="w-4 h-4" /> Tips
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.flights.tips.map((t) => (
                <div key={t} className="rounded-[14px] border border-slate-200 bg-white p-3 text-[13px] text-slate-700">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "accommodation" ? (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-slate-900">Average nightly</div>
            <div className="mt-1 text-[14px] text-slate-600">{insights.hotels.avgPrice}</div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-slate-900">Best areas</div>
            <div className="mt-2 space-y-2">
              {insights.hotels.bestAreas.map((a) => (
                <div key={a} className="flex items-center gap-2 text-[13px] text-slate-700">
                  <MapPin className="w-4 h-4" /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "visa" ? (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-slate-900">Visa requirement</div>
            <div className="mt-1 text-[14px] text-slate-600">{insights.visa.required}</div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
              <AlertCircle className="w-4 h-4" /> Reminder
            </div>
            <div className="mt-1 text-[13px] text-slate-600">
              Apply early. Many destinations require 6+ months passport validity.
            </div>
          </div>
        </div>
      ) : null}

      {tab === "culture" ? (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-slate-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-slate-900">Etiquette basics</div>
            <div className="mt-2 text-[13px] text-slate-600">Tipping: {insights.culture.tipping}</div>
            <div className="mt-1 text-[13px] text-slate-600">Dress: {insights.culture.dressCode}</div>
            <div className="mt-1 text-[13px] text-slate-600">{insights.culture.language}</div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
