"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SakugaFX = {
  calm: boolean;
  at: (element: HTMLElement, x?: number, y?: number) => { x: number; y: number; w: number; h: number };
  burst: (x: number, y: number, options: { r: number; spikes: number; life: number }) => void;
  puff: (x: number, y: number, options: { n: number; size: number; life: number }) => void;
  ticks: (x: number, y: number, options: { n: number; r: number; len: number }) => void;
  shards: (x: number, y: number, options: { n: number; speed: number; size: number }) => void;
};

/** Use the original Sakuga drawing engine while retaining native React controls and forms. */
export function SakugaMotion() {
  const [ready, setReady] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const pathname = usePathname();
  const enabled = motionAllowed && !pathname.startsWith("/admin");
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!ready || !enabled) return;
    const fx = (window as Window & { SakugaFX?: SakugaFX }).SakugaFX;
    if (!fx) return;
    const animations = new Map<HTMLElement, Animation>();
    let lastEffect = 0;

    const onClick = (event: MouseEvent) => {
      if (fx.calm || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("button, .ff-btn, [role='tab'], summary, input[type='checkbox'], input[type='radio']");
      if (!control || control.closest(".ff-admin") || control.matches(":disabled, [aria-disabled='true']")) return;
      const now = performance.now();
      if (now - lastEffect < 100) return;
      lastEffect = now;
      const { x, y, w, h } = fx.at(control);
      const primary = control.matches(".ff-btn-gold, .sakuga-primary, [data-sakuga='primary']");
      fx.ticks(x + w * 0.35, y - h * 0.3, { n: 3, r: 13, len: 8 });
      if (primary) {
        fx.burst(x, y, { r: Math.min(60, w * 0.4), spikes: 11, life: 0.32 });
        fx.shards(x, y, { n: 6, speed: 115, size: 4 });
        fx.puff(x - w * 0.35, y + h * 0.3, { n: 3, size: 9, life: 0.55 });
        fx.puff(x + w * 0.35, y + h * 0.3, { n: 3, size: 9, life: 0.55 });
      }
      // Additive transforms preserve positioning transforms on drawers and gallery controls.
      animations.get(control)?.cancel();
      const animation = control.animate([
        { transform: "scale(1.05, .84)", offset: 0 },
        { transform: "scale(.97, 1.08)", offset: 0.4 },
        { transform: "scale(1.02, .98)", offset: 0.7 },
        { transform: "scale(1)", offset: 1 },
      ], { duration: 380, easing: "ease-out", composite: "add" });
      animations.set(control, animation);
      animation.onfinish = () => animations.delete(control);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      animations.forEach((animation) => animation.cancel());
    };
  }, [ready, enabled]);

  return enabled ? <Script src="/sakuga-vfx/core.js" strategy="lazyOnload" onReady={() => setReady(true)} /> : null;
}
