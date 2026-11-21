"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

const sections: Record<string, string> = {
  products: "Products", orders: "Orders", inventory: "Inventory", "restock-requests": "Restock demand",
  categories: "Categories", discounts: "Discounts", customers: "Customers", analytics: "Analytics",
  reviews: "Reviews", homepage: "Homepage CMS", media: "Media library", settings: "Store settings",
};

/** Presentation only. Authentication and account actions remain in the admin layout. */
export function AdminWorkspace({ children, email, onLogout }: {
  children: React.ReactNode; email?: string; onLogout: () => void;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const parts = pathname.split("/").filter(Boolean);
  const section = sections[parts[1]] || "Overview";
  const detail = parts[2] === "new" ? "Create new" : parts.length > 2 ? (parts[3] === "edit" ? "Edit details" : "Details") : null;

  return <div className="ff-admin admin-workspace">
    <a className="admin-skip-link" href="#admin-content">Skip to content</a>
    <AdminSidebar isDrawerOpen={drawerOpen} onClose={closeDrawer} />
    <div className="admin-workspace-body">
      <header className="admin-topbar">
        <div className="admin-topbar-start">
          <button type="button" className="admin-icon-button admin-menu-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open admin navigation" aria-expanded={drawerOpen} aria-controls="admin-mobile-navigation"><Menu size={20} /></button>
          <nav aria-label="Breadcrumb" className="admin-breadcrumb">
            <Link href="/admin" className="admin-breadcrumb-home">Workspace</Link><span aria-hidden="true">/</span>
            {detail ? <><Link href={`/admin/${parts[1]}`}>{section}</Link><span aria-hidden="true">/</span><span aria-current="page">{detail}</span></> : <span aria-current="page">{section}</span>}
          </nav>
        </div>
        <div className="admin-account-actions">
          <Link className="admin-store-link" href="/" target="_blank" rel="noopener noreferrer">View store <ExternalLink size={15} /></Link>
          <div className="admin-account"><span className="admin-avatar" aria-hidden="true">{(email || "A").charAt(0).toUpperCase()}</span><div><strong>Administrator</strong><span title={email}>{email || "Admin account"}</span></div></div>
          <button type="button" className="admin-icon-button" onClick={onLogout} aria-label="Admin logout" title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <main id="admin-content" tabIndex={-1} className="admin-main">{children}</main>
      <footer className="admin-workspace-footer"><span>Fiction Figures · Store workspace</span><span><ShieldCheck size={14} /> Administrator access</span></footer>
    </div>
  </div>;
}
