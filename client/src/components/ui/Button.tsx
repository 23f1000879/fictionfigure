"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "gold" | "ghost" | "danger" | "outline";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  gold: "bg-gradient-to-r from-[#F5C518] to-[#D4AF37] text-[#0A0A0C] font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98]",
  primary: "bg-[#181920] text-white border border-white/12 shadow-md shadow-black/40 hover:bg-[#22242D] hover:border-white/20 hover:-translate-y-0.5 active:scale-[0.98]",
  secondary: "bg-white/[0.04] text-[#F8FAFC] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:-translate-y-0.5 active:scale-[0.98]",
  outline: "bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/40 hover:-translate-y-0.5 active:scale-[0.98]",
  ghost: "bg-transparent text-[#94A3B8] hover:text-white hover:bg-white/[0.06] active:scale-[0.98]",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 hover:-translate-y-0.5 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "text-xs px-2.5 py-1.5 rounded-lg min-h-[32px] gap-1.5",
  sm: "text-xs uppercase font-semibold tracking-wider px-3.5 py-2 rounded-xl min-h-[38px] gap-2",
  md: "text-sm font-semibold px-5 py-2.5 rounded-xl min-h-[44px] gap-2",
  lg: "text-base font-semibold px-6 py-3.5 rounded-xl min-h-[50px] gap-2.5",
  xl: "text-base uppercase tracking-wider font-bold px-8 py-4 rounded-2xl min-h-[56px] gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyle =
      "inline-flex items-center justify-center font-sans select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C518]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`
          ${baseStyle}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
