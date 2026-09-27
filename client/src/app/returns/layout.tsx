import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Returns & Replacements Policy",
  description: "Review our replacement guidelines: 48-hour reporting window for transit damage, art box integrity, and support hours.",
  alternates: {
    canonical: "/returns",
  }
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
