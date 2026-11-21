"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
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

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = document.getElementById("admin-mobile-navigation");
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || []);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
      if (event.key !== "Tab") return;
      const controls = focusable();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose?.(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); desktop.removeEventListener("change", closeOnDesktop); previousFocus?.focus(); };
  }, [isDrawerOpen, onClose]);

  const navGroups = [
    { title: "Workspace", items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/restock-requests", label: "Restock demand", icon: Bell, badge: pendingRestockCount },
    ] },
    { title: "Catalog & customers", items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/discounts", label: "Discounts", icon: Tag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ] },
    { title: "Storefront", items: [
      { href: "/admin/homepage", label: "Homepage CMS", icon: LayoutDashboard },
      { href: "/admin/media", label: "Media library", icon: Boxes },
      { href: "/admin/settings", label: "Store settings", icon: Sliders },
    ] },
  ];

  const sidebarContent = (mobile = false) => <div className="admin-sidebar-content">
    <div className="admin-sidebar-brand"><Link href="/admin" onClick={mobile ? onClose : undefined} aria-label="Fiction Figures admin home"><BrandLogo className="admin-wordmark" /></Link><span>STORE WORKSPACE</span>{mobile && <button type="button" onClick={onClose} className="admin-icon-button admin-drawer-close" aria-label="Close navigation"><X size={19} /></button>}</div>
    <nav className="admin-sidebar-nav" aria-label={mobile ? "Mobile admin navigation" : "Admin navigation"}>{navGroups.map(group => <div className="admin-nav-group" key={group.title}><h2>{group.title}</h2>{group.items.map(item => {
      const Icon = item.icon;
      const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
      return <Link key={item.href} href={item.href} onClick={mobile ? onClose : undefined} aria-current={active ? "page" : undefined} className={`admin-nav-link ${active ? "is-active" : ""}`}><Icon size={18} /><span>{item.label}</span>{item.badge !== undefined && item.badge !== null && item.badge > 0 && <span className="admin-nav-badge">{item.badge}</span>}</Link>;
    })}</div>)}</nav>
    <div className="admin-sidebar-footer"><div className="admin-access-label"><ShieldCheck size={17} /><span>Administrator workspace</span></div><Link href="/" target="_blank" rel="noopener noreferrer" onClick={mobile ? onClose : undefined}><ExternalLink size={16} /><span>View storefront</span></Link><button type="button" onClick={() => { if (mobile) onClose?.(); handleLogout(); }}><LogOut size={16} /><span>Sign out</span></button></div>
  </div>;

  return <>
    <aside className="admin-sidebar-desktop">{sidebarContent()}</aside>
    {isDrawerOpen && <div className="admin-drawer-layer"><div className="admin-drawer-backdrop" onClick={onClose} aria-hidden="true" /><aside id="admin-mobile-navigation" className="admin-sidebar-mobile" role="dialog" aria-modal="true" aria-label="Admin navigation">{sidebarContent(true)}</aside></div>}
  </>;
}
