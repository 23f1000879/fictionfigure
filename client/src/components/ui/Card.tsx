"use client";

import React, { forwardRef } from "react";

export type CardVariant = "default" | "elevated" | "glass" | "interactive" | "glow";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  rounded?: "lg" | "xl" | "2xl";
  noPadding?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[#121318] border border-white/[0.08] text-white shadow-card",
  elevated: "bg-[#181920] border border-white/[0.12] text-white shadow-card",
  glass: "bg-[#121318]/80 backdrop-blur-xl border border-white/[0.08] text-white shadow-card",
  interactive: "bg-[#121318] border border-white/[0.08] hover:border-[#F5C518]/40 hover:shadow-cardHover text-white cursor-pointer transition-all duration-300 hover:-translate-y-1",
  glow: "bg-[#121318] border border-[#F5C518]/30 shadow-[0_0_25px_rgba(245,197,24,0.12)] text-white",
};

const roundedStyles = {
  lg: "rounded-xl",
  xl: "rounded-2xl",
  "2xl": "rounded-3xl",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      rounded = "xl",
      noPadding = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative overflow-hidden box-border
          ${variantStyles[variant]}
          ${roundedStyles[rounded]}
          ${noPadding ? "" : "p-5 sm:p-6"}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
