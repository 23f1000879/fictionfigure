import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Terms & Conditions | FictionFigure",
  description: "Read the official terms, user account responsibilities, order policies, and conditions governing the FictionFigure storefront.",
  alternates: {
    canonical: "https://www.fictionfigures.in/terms",
  }
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
