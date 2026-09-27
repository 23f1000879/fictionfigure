import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact Us — Customer Support",
  description: "Get in touch with the Fiction Figures support team. Reach us for order status, shipping inquiries, and replacement checks.",
  alternates: {
    canonical: "/contact",
  }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
