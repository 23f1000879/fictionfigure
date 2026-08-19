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
  announcements: AnnouncementItem[];
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
}

const DEFAULT_CONTEXT: StoreSettingsContextType = {
  shippingFee: 100,
  freeShippingThreshold: 500,
  storeLocation: "Bikaner, Rajasthan, India",
  deliveryCoverage: "We deliver across India.",
  announcements: [
    { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
    { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.", enabled: true, sortOrder: 2 },
  ],
  isLoading: true,
  refetchSettings: async () => {},
};

const SettingsContext = createContext<StoreSettingsContextType>(DEFAULT_CONTEXT);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [shippingFee, setShippingFee] = useState<number>(100);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(500);
  const [storeLocation, setStoreLocation] = useState<string>("Bikaner, Rajasthan, India");
  const [deliveryCoverage, setDeliveryCoverage] = useState<string>("We deliver across India.");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
    { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
    { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.", enabled: true, sortOrder: 2 },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();

      if (data.shippingFee !== undefined) {
        setShippingFee(Number(data.shippingFee) || 100);
      }
      if (data.freeShippingThreshold !== undefined) {
        setFreeShippingThreshold(Number(data.freeShippingThreshold) || 500);
      }
      if (data.storeLocation) {
        setStoreLocation(data.storeLocation);
      }
      if (data.deliveryCoverage) {
        setDeliveryCoverage(data.deliveryCoverage);
      }
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
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
        announcements,
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
