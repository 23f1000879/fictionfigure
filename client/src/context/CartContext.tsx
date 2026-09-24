"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/lib/api";

export interface CartItemType {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  price: number;
  image: string;
  quantity: number;
  sku: string;
  brand: string;
}

export interface CartReconciliationResult {
  valid: boolean;
  items: CartItemType[];
  removedItems: { variantId: string; productId: string; title: string; reason: string }[];
  updatedItems: { variantId: string; oldPrice?: number; newPrice?: number; oldQuantity?: number; newQuantity?: number; reason: string }[];
}

interface CartContextType {
  cart: CartItemType[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isHydrating: boolean;
  isValidating: boolean;
  addItem: (item: Omit<CartItemType, "id">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  reconcileCart: () => Promise<CartReconciliationResult>;
  cartCount: number;
  cartSubtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CURRENT_CART_VERSION = 2;
const STORAGE_KEY_V2 = "fictionfigure_cart_v2";
const LEGACY_STORAGE_KEY = "fictionfigure_cart";

function getStoredCartRaw(): CartItemType[] {
  if (typeof window === "undefined") return [];

  try {
    // 1. Try v2 format
    const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (parsed && typeof parsed === "object" && parsed.version === CURRENT_CART_VERSION && Array.isArray(parsed.items)) {
        return parsed.items;
      }
      // If version mismatch or malformed structure, fall back
    }

    // 2. Try legacy migration
    const savedLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (savedLegacy) {
      const parsedLegacy = JSON.parse(savedLegacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY); // Clean legacy key
      if (Array.isArray(parsedLegacy)) {
        const migrated = parsedLegacy.map((item: any) => ({
          id: item.id || `${item.variantId}-${Date.now()}`,
          variantId: String(item.variantId || ""),
          productId: String(item.productId || ""),
          title: String(item.title || "Collectible Figure"),
          variantTitle: String(item.variantTitle || "Standard"),
          price: Number(item.price) || 0,
          image: String(item.image || ""),
          quantity: Math.max(1, Number(item.quantity) || 1),
          sku: String(item.sku || ""),
          brand: String(item.brand || "FictionFigure"),
        })).filter(i => Boolean(i.variantId));

        saveStoredCartRaw(migrated);
        return migrated;
      }
    }
  } catch (e) {
    console.error("[CART PERSISTENCE] Safe parse fallback on malformed cart storage:", e);
    try {
      localStorage.removeItem(STORAGE_KEY_V2);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (_) {}
  }
  return [];
}

function saveStoredCartRaw(items: CartItemType[]) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      version: CURRENT_CART_VERSION,
      updatedAt: new Date().toISOString(),
      items,
    };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch (e) {
    console.error("[CART PERSISTENCE] Failed to save cart to localStorage:", e);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // Server-side Batched Cart Validation & Reconciliation
  const reconcileCart = useCallback(async (): Promise<CartReconciliationResult> => {
    setIsValidating(true);
    const localItems = getStoredCartRaw();

    if (localItems.length === 0) {
      setCart([]);
      saveStoredCartRaw([]);
      setIsValidating(false);
      setIsHydrating(false);
      return { valid: true, items: [], removedItems: [], updatedItems: [] };
    }

    try {
      const res = await fetch(`${API_BASE}/checkout/validate-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: localItems }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const validatedItems: CartItemType[] = data.items || [];
          setCart(validatedItems);
          saveStoredCartRaw(validatedItems);
          setIsValidating(false);
          setIsHydrating(false);

          return {
            valid: data.valid,
            items: validatedItems,
            removedItems: data.removedItems || [],
            updatedItems: data.updatedItems || [],
          };
        }
      }
    } catch (e) {
      console.error("[CART RECONCILIATION] Failed to reach validation API:", e);
    }

    // Fallback if offline/failed API: keep local items safely
    setCart(localItems);
    setIsValidating(false);
    setIsHydrating(false);
    return { valid: true, items: localItems, removedItems: [], updatedItems: [] };
  }, []);

  // 1. Initial Mount & Hydration + Immediate Server Reconciliation
  useEffect(() => {
    const raw = getStoredCartRaw();
    setCart(raw);
    reconcileCart();
  }, [reconcileCart]);

  // 2. Cross-Tab Synchronization Listener
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY_V2) {
        const fresh = getStoredCartRaw();
        setCart(fresh);
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save cart changes to localStorage & sync state
  const updateCartState = (newCart: CartItemType[]) => {
    setCart(newCart);
    saveStoredCartRaw(newCart);
  };

  const addItem = (newItem: Omit<CartItemType, "id">) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === newItem.variantId);
      let updated: CartItemType[];
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
      } else {
        updated = [...prev, { ...newItem, id: `${newItem.variantId}-${Date.now()}` }];
      }
      saveStoredCartRaw(updated);
      return updated;
    });
    setIsCartOpen(true);
  };

  const removeItem = (variantId: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.variantId !== variantId);
      saveStoredCartRaw(updated);
      return updated;
    });
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) => (item.variantId === variantId ? { ...item, quantity } : item));
      saveStoredCartRaw(updated);
      return updated;
    });
  };

  const clearCart = useCallback(() => {
    setCart([]);
    saveStoredCartRaw([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY_V2);
        sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (_) {}
    }
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isHydrating,
        isValidating,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        reconcileCart,
        cartCount,
        cartSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
