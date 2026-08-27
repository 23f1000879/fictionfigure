import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "About Our Gallery | FictionFigure",
  description: "Learn about the FictionFigure manifesto: sourcing 100% authentic designer statues and reinforced protective collector packing.",
  alternates: {
    canonical: "https://www.fictionfigures.in/about",
  }
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
