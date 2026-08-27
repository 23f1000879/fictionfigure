import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | FictionFigure",
  description: "Understand how FictionFigure collects, uses, and protects your personal account data and billing details.",
  alternates: {
    canonical: "https://www.fictionfigures.in/privacy",
  }
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
