"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        bg-[#121318]/60 border border-white/[0.08] rounded-2xl max-w-md mx-auto
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F5C518] mb-5 shadow-inner">
        {icon || <Sparkles className="w-7 h-7" />}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-[#94A3B8] max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button variant="gold" size="md">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button variant="gold" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
