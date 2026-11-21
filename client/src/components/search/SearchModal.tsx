"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { OverlayLoading } from "@/components/ui/OverlayLoading";

const Panel = dynamic(() => import("./SearchPanel").then(module => module.SearchPanel), { ssr: false, loading: () => <OverlayLoading kind="search" /> });

export function SearchModal() {
  const { isSearchOpen } = useCart();
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (isSearchOpen) setOpened(true); }, [isSearchOpen]);
  return isSearchOpen || opened ? <Panel /> : null;
}
