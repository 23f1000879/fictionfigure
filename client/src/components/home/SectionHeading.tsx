import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  as?: "h1" | "h2";
  className?: string;
}

/** Reference block header: gold micro-eyebrow, bold title, muted sub-line, "View All →" on the right. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  linkText,
  linkUrl,
  as: Tag = "h2",
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="ff-eyebrow">
            <Sparkles className="w-3 h-3" aria-hidden />
            <span className="truncate">{eyebrow}</span>
          </p>
        )}
        <Tag className="ff-section-title line-clamp-2">{title}</Tag>
        {description && <p className="ff-section-sub line-clamp-1">{description}</p>}
      </div>
      {linkUrl && linkText && (
        <Link href={linkUrl} className="ff-link-arrow shrink-0 pb-0.5" aria-label={linkText}>
          <span className="hidden sm:inline">{linkText}</span>
          <span className="sm:hidden ff-circle-arrow w-8 h-8">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <ArrowRight className="hidden sm:block w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
