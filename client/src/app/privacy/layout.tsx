import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Understand how Fiction Figures collects, uses, and protects your personal account data and billing details.",
  alternates: {
    canonical: "/privacy",
  }
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
