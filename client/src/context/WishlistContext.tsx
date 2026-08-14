"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/lib/api";

interface WishlistContextType {
  wishlistProducts: any[];
  wishlistCount: number;
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshWishlist = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
    if (!token) {
      setWishlistProducts([]);
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (res.status === 401) {
        localStorage.removeItem("fictionfigure_token");
        setWishlistProducts([]);
        setWishlistIds(new Set());
        setLoading(false);
        return;
      }

      const data = await res.json();
      const prods = data.products || (data.items ? data.items.map((i: any) => i.product).filter(Boolean) : []);
      setWishlistProducts(prods);
      setWishlistIds(new Set(prods.map((p: any) => p.id)));
    } catch (e) {
      console.error("Wishlist refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") : null;
    if (!token) {
      if (typeof window !== "undefined") {
        window.location.href = `/login?redirect=/account/wishlist`;
      }
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshWishlist();
        return Boolean(data.inWishlist);
      }
    } catch (e) {
      console.error("Failed to toggle wishlist item:", e);
    }
    return false;
  };

  const isInWishlist = (productId: string) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistProducts,
        wishlistCount: wishlistProducts.length,
        loading,
        toggleWishlist,
        refreshWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
