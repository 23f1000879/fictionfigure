import React from "react";

interface BrandLogoProps { className?: string; priority?: boolean; }
/** Scalable, theme-aware wordmark from the approved storefront concept. */
export function BrandLogo({ className = "h-9" }: BrandLogoProps) {
  return <span className={`concept-wordmark ${className}`} role="img" aria-label="Fiction Figures">
    <svg viewBox="0 0 430 76" fill="none" aria-hidden="true" focusable="false">
      <text x="5" y="53" fill="currentColor" fontSize="55" fontWeight="700" fontStyle="italic" textLength="399" lengthAdjust="spacingAndGlyphs">FICTION FIGURES</text>
      <path d="M144 68C218 54 292 59 368 61C293 63 233 65 170 73L144 68Z" fill="#f83c98" />
      <path d="M411 24L424 15L420 29L411 30ZM414 35L429 33L425 40L414 38ZM407 17L411 4L415 13L411 21Z" fill="#f83c98" />
    </svg>
  </span>;
}
