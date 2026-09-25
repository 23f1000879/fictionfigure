"use client";

import React from "react";

export type BadgeVariant = "gold" | "success" | "warning" | "danger" | "neutral" | "purple" | "cyan" | "outline";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  glow?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/30",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  danger: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
  purple: "bg-purple-500/10 text-purple-300 border border-purple-500/30",
  cyan: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
  neutral: "bg-white/[0.06] text-[#94A3B8] border border-white/10",
  outline: "bg-transparent text-white/90 border border-white/20",
};

const dotColors: Record<BadgeVariant, string> = {
  gold: "bg-[#F5C518]",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  purple: "bg-purple-400",
  cyan: "bg-cyan-400",
  neutral: "bg-slate-400",
  outline: "bg-white",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md gap-1.5",
  md: "text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-lg gap-1.5",
  lg: "text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg gap-2",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  glow = false,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-mono select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${glow && variant === "gold" ? "shadow-[0_0_12px_rgba(245,197,24,0.3)]" : ""}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      <span>{children}</span>
    </span>
  );
}
