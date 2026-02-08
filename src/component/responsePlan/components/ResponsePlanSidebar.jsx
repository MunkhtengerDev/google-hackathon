import React from "react";
import {
  Brain,
  Camera,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCcw,
  Shield,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";

function NavItem({ active, icon, label, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-2xl px-3.5 py-3 text-left transition",
        active
          ? "bg-[#0b5b57] text-white shadow-[0_14px_30px_rgba(11,91,87,0.20)]"
          : "bg-transparent text-[#2f4954] hover:bg-[#fff3df]",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "grid h-9 w-9 place-items-center rounded-xl border transition",
            active
              ? "border-white/20 bg-white/10"
              : "border-[#e8dcc8] bg-[#fffaf1] group-hover:bg-white",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-[13px] font-semibold">{label}</div>
            {badge ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  active
                    ? "bg-white/15 text-white"
                    : "bg-[#ffe6bf] text-[#6a4a12]",
                ].join(" ")}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <div
            className={[
              "mt-0.5 flex items-center gap-1 text-[11px]",
              active ? "text-white/75" : "text-[#74878f]",
            ].join(" ")}
          >
            <ChevronRight className="h-3 w-3" />
            View details
          </div>
        </div>
      </div>
    </button>
  );
}

function Pill({ icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d7c3] bg-[#fffaf1] px-3 py-1.5 text-[12px] font-semibold text-[#2f4954]">
      {icon}
      {text}
    </div>
  );
}

export default function ResponsePlanSidebar({
  active,
  onChangeActive,
  timelineStops,
  title,
  subtitle,
  onRefresh,
  lastPlanAt,
  formatTimestamp,
}) {
  return (
    <aside className="lg:col-span-3">
      <Card className="sticky top-6">
        <SectionHeader
          right={
            onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </button>
            ) : null
          }
        />

        <div className="space-y-2">
          <NavItem
            active={active === "timeline"}
            onClick={() => onChangeActive("timeline")}
            label="Timeline Guide"
            badge={`${timelineStops.length}`}
            icon={<Brain className="h-4 w-4" />}
          />
          <NavItem
            active={active === "wallet"}
            onClick={() => onChangeActive("wallet")}
            label="Wallet"
            icon={<Wallet className="h-4 w-4" />}
          />
          <NavItem
            active={active === "guide"}
            onClick={() => onChangeActive("guide")}
            label="Guide Companion"
            icon={<Shield className="h-4 w-4" />}
          />
          <NavItem
            active={active === "memories"}
            onClick={() => onChangeActive("memories")}
            label="Memories"
            icon={<Camera className="h-4 w-4" />}
          />
          <NavItem
            active={active === "rightnow"}
            onClick={() => onChangeActive("rightnow")}
            label="Right Now"
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill
            icon={<MapPin className="h-3.5 w-3.5" />}
            text="Location-aware"
          />
          <Pill icon={<Clock className="h-3.5 w-3.5" />} text="Time logic" />
        </div>
        <div className="mt-3 rounded-2xl border border-[#eadfcf] bg-[#fffaf1] px-3 py-2 text-[11px] text-[#5d727c]">
          <div>Plan updated: {formatTimestamp(lastPlanAt)}</div>
        </div>
      </Card>
    </aside>
  );
}
