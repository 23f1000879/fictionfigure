"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

export interface AnnouncementItem {
  id: string;
  text: string;
  enabled: boolean;
  sortOrder: number;
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
  heroImageUrl: string;
  /** Existing cinematic campaign art for atmospheric page backgrounds (auth, about). */
  cinematicBackgroundUrl: string;
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
  heroImageUrl: "",
  cinematicBackgroundUrl: "",
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
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");
  const [cinematicBackgroundUrl, setCinematicBackgroundUrl] = useState<string>("");
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
      // Universes-page background (admin setting) first, then the first hero slide's cinematic background.
      const configuredBackdrop = data.settings?.collections_hero_image_url;
      const slideBackdrop = Array.isArray(data.carouselSlides)
        ? data.carouselSlides.find((s: any) => s && s.backgroundImage)?.backgroundImage
        : "";
      setCinematicBackgroundUrl(
        (typeof configuredBackdrop === "string" && configuredBackdrop.trim()) || slideBackdrop || ""
      );
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
        heroImageUrl,
        cinematicBackgroundUrl,
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
