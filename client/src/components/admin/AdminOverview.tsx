"use client";

import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { AlertCircle, Boxes, Clock, Image, Package, Plus, Settings2, ShieldCheck, ShoppingBag, TrendingUp } from "lucide-react";

const statusStyle: Record<string, string> = { PENDING: "pending", PROCESSING: "processing", SHIPPED: "shipped", DELIVERED: "delivered", CANCELLED: "cancelled" };

/** Renders the existing dashboard response without changing requests or stored data. */
export function AdminOverview({ stats, errorMsg }: { stats: any; errorMsg: string }) {
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const recentOrders = stats?.recentOrders || [];
  const metrics = [
    { label: "Total revenue", value: formatPrice(totalRevenue), note: "Store revenue to date", icon: TrendingUp, tone: "violet" },
    { label: "Total orders", value: totalOrders, note: "All customer orders", icon: ShoppingBag, tone: "blue" },
    { label: "Pending orders", value: pendingOrders, note: "Awaiting fulfillment", icon: Clock, tone: "amber" },
    { label: "Active products", value: totalProducts, note: "Products in your catalog", icon: Package, tone: "pink" },
  ];

  return <div className="admin-overview">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR STORE AT A GLANCE</span><h1>Store overview</h1><p>Keep track of orders, manage your catalog, and plan your next drop.</p></div><Link href="/admin/products/new" className="admin-button admin-button-primary"><Plus size={18} /> Add new product</Link></div>

    {errorMsg && <div className="admin-alert" role="alert"><AlertCircle size={19} /><div><strong>We couldn’t load your store summary.</strong><p>{errorMsg}</p></div></div>}

    <section className="admin-metrics" aria-label="Store metrics">{metrics.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="admin-metric"><div className="admin-metric-top"><span>{label}</span><span className={`admin-metric-icon ${tone}`}><Icon size={19} /></span></div><strong>{errorMsg ? "—" : value}</strong><p>{errorMsg ? "Currently unavailable" : note}</p></article>)}</section>

    <section className="admin-welcome" aria-labelledby="admin-welcome-title">
      <div><span className="admin-eyebrow">THE DAILY CHECK-IN</span><h2 id="admin-welcome-title">A little clarity.<br />A smoother store day.</h2><p>Your orders, products, and storefront. All in one workspace.</p><Link href="/admin/orders" className="admin-button admin-button-white"><ShoppingBag size={17} /> Manage orders</Link></div>
      <div className="admin-focus-card"><span className="admin-focus-icon"><Clock size={22} /></span><span>Fulfillment focus</span><strong>{errorMsg ? "—" : pendingOrders}</strong><p>{errorMsg ? "Summary currently unavailable" : pendingOrders === 1 ? "order awaiting fulfillment" : "orders awaiting fulfillment"}</p><Link href="/admin/orders">Review order queue</Link></div>
      <div className="admin-welcome-art" aria-hidden="true"><span /><span /><span /></div>
    </section>



    <div className="admin-overview-columns">
      <section className="admin-panel admin-recent-orders" aria-labelledby="recent-orders-title"><div className="admin-panel-heading"><div><h2 id="recent-orders-title">Recent orders</h2><p>The latest activity from your store.</p></div><Link href="/admin/orders" className="admin-text-link">View all orders</Link></div>
        {recentOrders.length === 0 ? <div className="admin-empty"><span><ShoppingBag size={27} /></span><h3>{errorMsg ? "Orders are unavailable" : "Your next order starts here"}</h3><p>{errorMsg ? "Visit Orders to check the full order list." : "Customer orders will appear here as shoppers check out."}</p><Link href="/admin/orders" className="admin-button admin-button-secondary">Open orders</Link></div> : <div className="admin-overview-table-scroll"><table className="admin-overview-table"><thead><tr><th scope="col">Order</th><th scope="col">Date / items</th><th scope="col">Total</th><th scope="col">Status</th></tr></thead><tbody>{recentOrders.map((order: any) => <tr key={order.id}><td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td><td><span>{formatDate(order.createdAt)}</span><small>{order._count?.items || 1} items</small></td><td>{formatPrice(order.totalAmount)}</td><td><span className={`admin-status ${statusStyle[order.status] || "neutral"}`}>{order.status}</span></td></tr>)}</tbody></table></div>}
      </section>
      <section className="admin-panel admin-shortcuts" aria-labelledby="shortcuts-title"><div className="admin-panel-heading"><div><h2 id="shortcuts-title">Everyday essentials</h2><p>Pick up where you need to.</p></div></div><div className="admin-shortcut-list">{[
        { href: "/admin/inventory", icon: Boxes, title: "Check inventory", note: "Stock levels and adjustments", tone: "violet" },
        { href: "/admin/homepage", icon: Image, title: "Update the storefront", note: "Homepage content and campaigns", tone: "pink" },
        { href: "/admin/settings", icon: Settings2, title: "Store settings", note: "Shipping, payments, and preferences", tone: "blue" },
      ].map(({ href, icon: Icon, title, note, tone }) => <Link href={href} key={href}><span className={`admin-metric-icon ${tone}`}><Icon size={20} /></span><span><strong>{title}</strong><small>{note}</small></span></Link>)}</div></section>
    </div>

    <section className="admin-panel admin-system-details" aria-labelledby="system-details-title"><div className="admin-panel-heading"><div><h2 id="system-details-title"><ShieldCheck size={18} /> System status</h2><p>Existing connection reference. This panel is not an independent health check.</p></div></div><div className="admin-system-grid"><div><span>Express API Server</span><strong>Port 5000 OK</strong></div><div><span>Next.js Storefront</span><strong>Port 3000 OK</strong></div><div><span>Database Engine</span><strong>Neon PostgreSQL OK</strong></div></div></section>
  </div>;
}
