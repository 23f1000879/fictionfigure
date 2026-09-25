import React from "react";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Box,
  Sparkles,
  Award,
  RotateCcw,
  Lock,
  PackageCheck,
  Flame,
  Star,
  Heart,
  RefreshCw,
  Layers,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";
import { DEFAULT_HOMEPAGE_CMS_CONFIG, TrustBenefitItem } from "@/types/cms";

// Mirrors SAFE_LUCIDE_ICONS in types/cms.ts — the icon names the admin can pick.
const ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Box,
  Sparkles,
  Award,
  RotateCcw,
  Lock,
  PackageCheck,
  Flame,
  Star,
  Heart,
  RefreshCw,
  Layers,
  CheckCircle2,
};

interface TrustStripProps {
  items?: TrustBenefitItem[];
  /** hero = bare inline row under the hero copy; full = one-row panel; compact = 2×2 panel */
  layout?: "hero" | "full" | "compact";
}

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());
}

export function TrustStrip({ items, layout = "full" }: TrustStripProps) {
  const source = items && items.length > 0 ? items : DEFAULT_HOMEPAGE_CMS_CONFIG.trustStrip.items;
  const active = source.filter((item) => item.enabled !== false).slice(0, 4);
  if (active.length === 0) return null;

  if (layout === "hero") {
    return (
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3" aria-label="Why collectors choose us">
        {active.map((item) => {
          const Icon = ICONS[item.icon] || ShieldCheck;
          return (
            <li key={item.id} className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#F7F7F5]" />
              </span>
              <span className="text-[11px] leading-tight text-[#F7F7F5]/85 line-clamp-2">{titleCase(item.title)}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  const compact = layout === "compact";
  return (
    <section aria-label="Collector reassurance" className="h-full">
      <ul
        className={`ff-panel h-full grid ${
          compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
        } overflow-hidden`}
      >
        {active.map((item, i) => {
          const Icon = ICONS[item.icon] || ShieldCheck;
          const borders = compact
            ? `${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t" : ""}`
            : `${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`;
          return (
            <li key={item.id} className={`flex items-center gap-3 px-4 py-4 lg:px-5 border-white/[0.06] ${borders}`}>
              <span className="w-9 h-9 rounded-full border border-white/[0.12] bg-white/[0.03] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#F7F7F5]" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#F7F7F5] leading-tight">{titleCase(item.title)}</p>
                {item.description && (
                  <p className="mt-0.5 text-[11px] text-[#9A9DA5] leading-snug line-clamp-2">{item.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
