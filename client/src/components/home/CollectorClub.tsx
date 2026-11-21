import React from "react";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";

interface CollectorClubProps {
  imageUrl?: string;
}

export function CollectorClub(_props: CollectorClubProps) {
  return (
    <section aria-label="Collector's Club" className="sakuga-club">
      <div>
        <span className="ff-eyebrow"><Sparkles size={14} aria-hidden /> Find your people</span>
        <h2>Your collection.<br />Your little universe.</h2>
        <p>Save the figures you love, keep track of your orders, and never lose sight of your next find.</p>
        <div className="flex flex-wrap items-center gap-4 pt-6">
          <Link href="/register" className="ff-btn ff-btn-gold">Join the collector&apos;s club</Link>
          <Link href="/login" className="font-bold text-sm underline underline-offset-4">Sign in</Link>
        </div>
      </div>
      <Star className="sakuga-club-mark" aria-hidden />
    </section>
  );
}
