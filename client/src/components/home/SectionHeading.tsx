import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  as?: "h1" | "h2";
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, linkText, linkUrl, as: Tag = "h2", className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 ${className}`}>
      <div className="min-w-0 space-y-2.5">
        {eyebrow && <p className="ff-eyebrow"><Sparkles className="w-3.5 h-3.5" aria-hidden /><span>{eyebrow}</span></p>}
        <Tag className="ff-section-title">{title}</Tag>
        {description && <p className="ff-section-sub">{description}</p>}
      </div>
      {linkUrl && linkText && <Link href={linkUrl} className="ff-link-arrow shrink-0 underline underline-offset-4 pb-1">{linkText}</Link>}
    </div>
  );
}
