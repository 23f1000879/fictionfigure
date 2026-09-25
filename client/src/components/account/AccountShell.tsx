"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, MapPin, Heart, Bell, User, LogOut, ShieldCheck } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { ArtworkFrame } from "@/components/ui/Artwork";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/restock-requests", label: "Restock Requests", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
];

interface AccountShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

/**
 * Reference account composition: compact left navigation + right content column
 * under an atmospheric artwork band.
 */
export function AccountShell({ children, isAdmin }: AccountShellProps) {
  const pathname = usePathname() || "/account";
  const router = useRouter();
  const { heroImageUrl } = useSettings();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);

  const signOut = () => {
    localStorage.removeItem("fictionfigure_token");
    router.push("/login");
  };

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 h-10 px-3 rounded-[8px] text-[13px] transition-colors whitespace-nowrap ${
      active
        ? "bg-[#17191F] text-white border border-white/[0.08]"
        : "text-[#9A9DA5] hover:text-white hover:bg-white/[0.03] border border-transparent"
    }`;

  return (
    <main className="relative flex-1 bg-[#08090B] text-[#F7F7F5] overflow-x-hidden">
      {/* Artwork band behind the page heading */}
      <div className="absolute inset-x-0 top-0 h-[280px] overflow-hidden pointer-events-none" aria-hidden>
        {heroImageUrl && <ArtworkFrame src={heroImageUrl} alt="" mode="ambient" ambientOpacity={0.3} />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/80 to-[#08090B]/30" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08090B] to-transparent" />
      </div>

      <div className="ff-container relative py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-10">
        {/* Navigation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav
            aria-label="Account"
            className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 lg:rounded-[12px] lg:border lg:border-white/[0.06] lg:bg-[#0D0E12]/80 lg:backdrop-blur lg:p-2"
          >
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#F5C518]" : ""}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" className={itemClass(false)}>
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Admin Console</span>
              </Link>
            )}
            <div className="hidden lg:block h-px bg-white/[0.06] my-1.5" />
            <button type="button" onClick={signOut} className={`${itemClass(false)} text-left`}>
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </main>
  );
}
