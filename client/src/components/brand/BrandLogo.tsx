import React from "react";
import Image from "next/image";

/**
 * Official FICTION FIGURES logo.
 *
 * - Day:   /brand/fiction-figures-logo-day.png — the supplied logo artwork (black + gold) with only its
 *          white background made transparent and the empty margin trimmed.
 * - Night: /fictionfigure-logo-light.png — the dark-header version of the same artwork.
 *   (Byte-exact original upload: /brand/fiction-figures-logo-original.webp.)
 *
 * The variant is chosen purely in CSS via the `dark` class that the pre-hydration script sets on <html>,
 * so there is no flash of the wrong logo, and both share one fixed-ratio box so switching never shifts layout.
 * The inactive variant is display:none, so assistive tech only ever announces one logo.
 */
interface BrandLogoProps {
  /** Height utility classes, e.g. "h-9 sm:h-10". Width follows the logo's aspect ratio. */
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ className = "h-9", priority = false }: BrandLogoProps) {
  return (
    <span className={`relative inline-block shrink-0 aspect-[332/100] ${className}`}>
      <Image
        src="/brand/fiction-figures-logo-day.png"
        alt="Fiction Figures"
        fill
        sizes="200px"
        priority={priority}
        className="object-contain object-left dark:hidden"
      />
      <Image
        src="/fictionfigure-logo-light.png"
        alt="Fiction Figures"
        fill
        sizes="200px"
        priority={priority}
        className="object-contain object-left hidden dark:block"
      />
    </span>
  );
}
