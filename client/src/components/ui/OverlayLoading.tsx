"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

/** Keep the first interaction responsive while an on-demand panel downloads. */
export function OverlayLoading({ kind }: { kind: "search" | "cart" }) {
  const { isSearchOpen, isCartOpen, setIsSearchOpen, setIsCartOpen } = useCart();
  const open = kind === "search" ? isSearchOpen : isCartOpen;
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (kind === "search") setIsSearchOpen(false); else setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKey); };
  }, [open, kind, setIsSearchOpen, setIsCartOpen]);
  if (!open) return null;
  const close = () => kind === "search" ? setIsSearchOpen(false) : setIsCartOpen(false);
  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-20" role="dialog" aria-modal="true" aria-label={kind === "search" ? "Opening search" : "Opening your bag"}>
    <div className="absolute inset-0" onClick={close} aria-hidden />
    <div className="relative w-full max-w-lg rounded-2xl border border-border-light bg-surface p-6 flex items-center gap-3 shadow-xl">
      <Loader2 size={22} className="animate-spin text-foreground-secondary" aria-hidden />
      <span role="status" className="flex-1">{kind === "search" ? "Opening search…" : "Opening your bag…"}</span>
      <button type="button" onClick={close} aria-label={kind === "search" ? "Close search" : "Close cart drawer"} className="min-w-11 min-h-11 grid place-items-center"><X size={20} /></button>
    </div>
  </div>;
}
