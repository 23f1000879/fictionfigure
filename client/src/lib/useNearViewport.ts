"use client";

import { useEffect, useRef, useState } from "react";

/** Load below-the-fold UI once, shortly before it scrolls into view. */
export function useNearViewport<T extends HTMLElement = HTMLDivElement>(rootMargin = "300px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [near, rootMargin]);
  return { ref, near };
}
