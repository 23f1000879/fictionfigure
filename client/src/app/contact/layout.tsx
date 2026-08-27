import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact FictionFigure | Customer Assistance",
  description: "Get in touch with the FictionFigure support team. Reach us for order status, shipping inquiries, and replacement checks.",
  alternates: {
    canonical: "https://www.fictionfigures.in/contact",
  }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
