"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  FolderTree,
  Tag,
  Users,
  BarChart3,
  Star,
  Sliders,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Bell,
  X,
} from "lucide-react";
import { API_BASE, safeApiFetch } from "@/lib/api";

interface AdminSidebarProps {
  isDrawerOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isDrawerOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingRestockCount, setPendingRestockCount] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fictionfigure_token") || localStorage.getItem("token") : null;
    if (!token) return;

    safeApiFetch<{ success: boolean; summary?: { totalPendingRequests: number } }>(
      `${API_BASE}/restock-requests/admin/summary`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((data) => {
        if (data.success && data.summary) {
          setPendingRestockCount(data.summary.totalPendingRequests || 0);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fictionfigure_token");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navGroups = [
    {
      title: "MANAGEMENT",
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/inventory", label: "Inventory", icon: Boxes },
        { href: "/admin/restock-requests", label: "Restock Demand", icon: Bell, badge: pendingRestockCount },
        { href: "/admin/categories", label: "Categories", icon: FolderTree },
        { href: "/admin/discounts", label: "Discounts", icon: Tag },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
      ],
    },
    {
      title: "STOREFRONT / CMS",
      items: [
        { href: "/admin/homepage", label: "Homepage CMS", icon: LayoutDashboard },
        { href: "/admin/media", label: "Media Library", icon: Boxes },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        { href: "/admin/settings", label: "Store Settings", icon: Sliders },
      ],
    },
  ];

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#2A2A2A] flex items-center space-x-3">
        <Image
          src="/icon-192.png"
          alt="Fiction Figures"
          width={28}
          height={28}
          className="h-7 w-auto object-contain"
        />
        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B6B6B] block">
            Commerce Console
          </span>
          <h2 className="text-sm font-bold tracking-tight text-white font-mono">
            FICTIONFIGURE <span className="text-[10px] text-[#2E6B44] uppercase font-mono">ADMIN</span>
          </h2>
        </div>
        <ShieldCheck className="w-5 h-5 text-[#2E6B44] shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 text-xs font-semibold uppercase tracking-wider overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-4 text-[10px] font-mono font-bold text-[#6B6B6B] tracking-widest uppercase mb-2">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                    isActive
                      ? "bg-white text-[#111111] font-bold"
                      : "text-[#A0A0A0] hover:text-white hover:bg-[#1E1E1E]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-[#B86E00] text-white text-[10px] font-mono font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer link to main Storefront & Sign Out */}
      <div className="p-4 border-t border-[#2A2A2A] space-y-2">
        <Link
          href="/"
          target="_blank"
          onClick={onLinkClick}
          className="flex items-center justify-between p-3 bg-[#1E1E1E] text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] hover:text-white transition-colors"
        >
          <span>View Storefront</span>
          <ExternalLink className="w-4 h-4" />
        </Link>

        <button
          onClick={() => {
            if (onLinkClick) onLinkClick();
            handleLogout();
          }}
          className="w-full flex items-center justify-between p-3 bg-[#A83232]/20 border border-[#A83232]/40 hover:bg-[#A83232]/40 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
        >
          <span>Admin Sign Out</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden lg:flex w-64 bg-[#111111] text-white flex-col shrink-0 min-h-screen border-r border-[#2A2A2A]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (overlay sidebar) */}
      <div className={`lg:hidden fixed inset-0 z-50 flex ${isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Drawer content panel */}
        <aside
          className={`relative w-64 max-w-xs bg-[#111111] text-white flex flex-col min-h-screen border-r border-[#2A2A2A] transform transition-transform duration-300 ease-in-out z-10 ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close Button inside Drawer */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="p-1 text-[#A0A0A0] hover:text-white focus:outline-none"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <SidebarContent onLinkClick={onClose} />
        </aside>
      </div>
    </>
  );
}
