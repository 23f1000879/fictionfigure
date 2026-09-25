"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export interface AnnouncementItem {
  id: string;
  text: string;
  enabled: boolean;
  sortOrder: number;
}

export interface HeaderNavLink {
  id: string;
  label: string;
  href: string;
}

export const DEFAULT_HEADER_NAV: HeaderNavLink[] = [
  { id: "1", label: "Shop", href: "/shop" },
  { id: "2", label: "Collections", href: "/collections" },
  { id: "3", label: "New Arrivals", href: "/shop?sortBy=newest" },
  { id: "4", label: "About", href: "/about" },
];

// Resolves a CMS header navigation entry (homepage_cms_config_json.headerNavigation) to a storefront href.
function resolveNavHref(type: string, destination: string): string {
  const dest = (destination || "").trim();
  if (!dest) return "/";
  switch (type) {
    case "category":
      return dest.startsWith("/") ? dest : `/shop?category=${dest}`;
    case "collection":
      return dest.startsWith("/") ? dest : `/collections/${dest}`;
    case "product":
      return dest.startsWith("/") ? dest : `/products/${dest}`;
    default:
      return dest;
  }
}

export interface StoreSettingsContextType {
  shippingFee: number;
  freeShippingThreshold: number;
  storeLocation: string;
  deliveryCoverage: string;
  supportPhone: string;
  supportEmail: string;
  supportHours: string;
  announcements: AnnouncementItem[];
  headerNavigation: HeaderNavLink[];
  heroImageUrl: string;
  upiId: string;
  upiQrUrl: string;
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
}

const DEFAULT_CONTEXT: StoreSettingsContextType = {
  shippingFee: 100,
  freeShippingThreshold: 500,
  storeLocation: "Bikaner, Rajasthan",
  deliveryCoverage: "Delivering across India",
  supportPhone: "+91 97974 94639",
  supportEmail: "support@fictionfigure.in",
  supportHours: "Monday - Saturday, 10:00 AM - 7:00 PM",
  announcements: [
    { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
    { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.", enabled: true, sortOrder: 2 },
    { id: "3", text: "LIMITED EDITION COLLECTIBLES AVAILABLE NOW.", enabled: true, sortOrder: 3 },
  ],
  headerNavigation: DEFAULT_HEADER_NAV,
  heroImageUrl: "",
  upiId: "fictionfigure@upi",
  upiQrUrl: "",
  isLoading: true,
  refetchSettings: async () => {},
};

const SettingsContext = createContext<StoreSettingsContextType>(DEFAULT_CONTEXT);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [shippingFee, setShippingFee] = useState<number>(100);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(500);
  const [storeLocation, setStoreLocation] = useState<string>("Bikaner, Rajasthan");
  const [deliveryCoverage, setDeliveryCoverage] = useState<string>("Delivering across India");
  const [supportPhone, setSupportPhone] = useState<string>("+91 97974 94639");
  const [supportEmail, setSupportEmail] = useState<string>("support@fictionfigure.in");
  const [supportHours, setSupportHours] = useState<string>("Monday - Saturday, 10:00 AM - 7:00 PM");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
    { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
    { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.", enabled: true, sortOrder: 2 },
    { id: "3", text: "LIMITED EDITION COLLECTIBLES AVAILABLE NOW.", enabled: true, sortOrder: 3 },
  ]);
  const [headerNavigation, setHeaderNavigation] = useState<HeaderNavLink[]>(DEFAULT_HEADER_NAV);
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("fictionfigure@upi");
  const [upiQrUrl, setUpiQrUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
      const data = await res.json();

      if (data.shippingFee !== undefined) {
        setShippingFee(Number(data.shippingFee) || 0);
      }
      if (data.freeShippingThreshold !== undefined) {
        setFreeShippingThreshold(Number(data.freeShippingThreshold) || 0);
      }
      if (typeof data.storeLocation === "string") {
        setStoreLocation(data.storeLocation);
      }
      if (typeof data.deliveryCoverage === "string") {
        setDeliveryCoverage(data.deliveryCoverage);
      }
      if (typeof data.supportPhone === "string") {
        setSupportPhone(data.supportPhone);
      }
      if (typeof data.supportEmail === "string") {
        setSupportEmail(data.supportEmail);
      }
      if (typeof data.supportHours === "string") {
        setSupportHours(data.supportHours);
      }
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
      if (typeof data.settings?.homepage_hero_image_url === "string") {
        setHeroImageUrl(data.settings.homepage_hero_image_url);
      }
      const cmsNav = data.homepageCmsConfig?.headerNavigation;
      if (Array.isArray(cmsNav)) {
        const links = cmsNav
          .filter((item: any) => item && item.enabled !== false && item.label)
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((item: any) => ({
            id: String(item.id),
            label: String(item.label),
            href: resolveNavHref(item.type, item.destination),
          }));
        if (links.length > 0) setHeaderNavigation(links);
      }
      if (typeof data.upiId === "string") {
        setUpiId(data.upiId);
      } else if (data.settings && typeof data.settings.upi_id === "string") {
        setUpiId(data.settings.upi_id);
      }
      if (typeof data.upiQrUrl === "string") {
        setUpiQrUrl(data.upiQrUrl);
      } else if (data.settings && typeof data.settings.upi_qr_url === "string") {
        setUpiQrUrl(data.settings.upi_qr_url);
      }
    } catch (err) {
      console.warn("Could not load dynamic store settings, using defaults.", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        shippingFee,
        freeShippingThreshold,
        storeLocation,
        deliveryCoverage,
        supportPhone,
        supportEmail,
        supportHours,
        announcements,
        headerNavigation,
        heroImageUrl,
        upiId,
        upiQrUrl,
        isLoading,
        refetchSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
