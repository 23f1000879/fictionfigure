import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "About Fiction Figures — Anime Collectibles Store",
  description: "Learn about Fiction Figures: sourcing 100% authentic designer statues and reinforced protective collector packing.",
  alternates: {
    canonical: "/about",
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
