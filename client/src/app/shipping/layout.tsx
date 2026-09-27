import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Shipping & Delivery in India",
  description: "Read our delivery policies: Pan-India courier coverage, dispatching from Bikaner (Rajasthan), protective collector layering, and free shipping thresholds.",
  alternates: {
    canonical: "/shipping",
  }
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
