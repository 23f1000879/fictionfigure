"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { OverlayLoading } from "@/components/ui/OverlayLoading";

const Panel = dynamic(() => import("./CartDrawerPanel").then(module => module.CartDrawerPanel), { ssr: false, loading: () => <OverlayLoading kind="cart" /> });

export function CartDrawer() {
  const { isCartOpen } = useCart();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (isCartOpen) setOpened(true); }, [isCartOpen]);
  return isCartOpen || opened ? <Panel /> : null;
}
