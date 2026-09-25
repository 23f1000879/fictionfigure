"use client";

import React, { forwardRef } from "react";

export type IconButtonVariant = "surface" | "glass" | "gold" | "ghost" | "danger" | "outline";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: "full" | "xl" | "lg";
  badge?: number | string | null;
  "aria-label": string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  surface: "bg-[#181920] text-white border border-white/10 hover:bg-[#22242D] hover:border-white/20 hover:text-[#F5C518] active:scale-95 shadow-sm shadow-black/40",
  glass: "bg-[#121318]/80 backdrop-blur-md text-white border border-white/10 hover:bg-[#1A1C24] hover:border-white/25 hover:text-[#F5C518] active:scale-95",
  gold: "bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20",
  ghost: "bg-transparent text-[#94A3B8] hover:text-white hover:bg-white/[0.08] active:scale-95",
  outline: "bg-transparent text-white border border-white/15 hover:border-white/35 hover:bg-white/5 active:scale-95",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 active:scale-95",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "w-9 h-9 min-w-[36px] min-h-[36px]",
  md: "w-11 h-11 min-w-[44px] min-h-[44px]", // 44px minimum recommended touch target
  lg: "w-12 h-12 min-w-[48px] min-h-[48px]",
};

const roundedStyles = {
  full: "rounded-full",
  xl: "rounded-2xl",
  lg: "rounded-xl",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      className = "",
      variant = "glass",
      size = "md",
      rounded = "xl",
      badge,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C]
          disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${roundedStyles[rounded]}
          ${className}
        `}
        {...props}
      >
        {children}
        {badge !== undefined && badge !== null && badge !== 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#F5C518] text-[#0A0A0C] text-[10px] font-bold rounded-full border border-[#0A0A0C] shadow-sm">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
