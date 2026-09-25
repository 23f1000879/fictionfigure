"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Flame,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Layers,
  Palette,
  Type,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton, ProductCardSkeleton, OrderRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";

export default function DesignSystemShowcasePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [inputText, setInputText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sampleProduct = {
    id: "showcase-prod-1",
    name: "Monkey D. Luffy — Gear 5 Sun God Collectible Figure",
    slug: "monkey-d-luffy-gear-5",
    brand: "ONE PIECE",
    price: 4999,
    compareAtPrice: 5999,
    rating: 4.9,
    reviewCount: 128,
    category: { name: "Scale Figures" },
    images: [
      {
        url: "https://res.cloudinary.com/dwyxedg8u/image/upload/v1711234567/sample_luffy.png",
        altText: "Luffy Gear 5",
      },
    ],
    variants: [
      {
        id: "v1",
        title: "Standard",
        price: 4999,
        compareAtPrice: 5999,
        sku: "OP-LFF-STD",
        inventoryCount: 12,
      },
      {
        id: "v2",
        title: "Collector's Edition",
        price: 6499,
        compareAtPrice: 7999,
        sku: "OP-LFF-COL",
        inventoryCount: 3,
      },
    ],
  };

  const showcaseTabs = [
    { id: "all", label: "All Items", count: 24 },
    { id: "figures", label: "Scale Figures", count: 18 },
    { id: "nendoroids", label: "Nendoroids", count: 6 },
    { id: "statues", label: "Premium Statues", count: 2 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F8FAFC] pb-24 font-sans selection:bg-[#F5C518] selection:text-[#0A0A0C]">
      {/* Design System Header Banner */}
      <div className="border-b border-white/[0.08] bg-[#121318]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="editorial-container py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5C518] to-[#D4AF37] flex items-center justify-center text-[#0A0A0C] font-black text-base shadow-md shadow-amber-500/20">
              FF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  FICTIONFIGURE Design System
                </h1>
                <Badge variant="gold" size="sm">Phase 8.0</Badge>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Cinematic Dark Anime-Commerce Design Tokens & Component Showcase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="secondary" size="xs">
                Back to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="editorial-container py-10 space-y-16">
        {/* Section 1: Brand & Theme Tokens */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Palette className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              1. Color Palette & Dark Canvas Tokens
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#0A0A0C] border border-white/10" />
              <div className="text-xs font-bold">Background</div>
              <div className="text-[10px] font-mono text-[#64748B]">#0A0A0C</div>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#121318] border border-white/10" />
              <div className="text-xs font-bold">Surface</div>
              <div className="text-[10px] font-mono text-[#64748B]">#121318</div>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#181920] border border-white/10" />
              <div className="text-xs font-bold">Elevated Surface</div>
              <div className="text-[10px] font-mono text-[#64748B]">#181920</div>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#F5C518]" />
              <div className="text-xs font-bold text-[#F5C518]">Brand Gold</div>
              <div className="text-[10px] font-mono text-[#64748B]">#F5C518</div>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#10B981]" />
              <div className="text-xs font-bold text-emerald-400">Success</div>
              <div className="text-[10px] font-mono text-[#64748B]">#10B981</div>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-[#121318] border border-white/[0.08]">
              <div className="w-full h-16 rounded-xl bg-[#EF4444]" />
              <div className="text-xs font-bold text-rose-400">Danger / Alert</div>
              <div className="text-[10px] font-mono text-[#64748B]">#EF4444</div>
            </div>
          </div>
        </section>

        {/* Section 2: Typography & Micro-labels */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Type className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              2. Typography Hierarchy & Micro-Labels
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#F5C518] font-bold">
                HEADINGS & HERO DISPLAY
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                BRING YOUR FAVOURITE STORIES TO LIFE
              </h1>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Featured Anime Figures & Collectibles
              </h2>
              <h3 className="text-lg font-semibold text-white">
                Authentic Figures. Iconic Characters. For True Collectors.
              </h3>
            </Card>

            <Card className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#F5C518] font-bold">
                BODY TEXT & MICRO-TAGS
              </span>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                FICTIONFIGURE is India's premier anime collectibles sanctuary. Every figure in our vault is guaranteed 100% authentic, directly sourced from licensed Japanese manufacturers.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-white/90">
                  PAN INDIA SHIPPING
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#F5C518]/10 border border-[#F5C518]/30 text-[#F5C518]">
                  LIMITED EDITION
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  SCALE 1/7
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 3: Buttons & Interactive Controls */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Layers className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              3. Button Design System & Icon Buttons
            </h2>
          </div>

          <div className="space-y-6">
            {/* Button Variants */}
            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Button Variants
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="gold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Gold CTA
                </Button>
                <Button variant="primary">
                  Primary Dark
                </Button>
                <Button variant="secondary">
                  Secondary Translucent
                </Button>
                <Button variant="outline">
                  Outline
                </Button>
                <Button variant="ghost">
                  Ghost Button
                </Button>
                <Button variant="danger">
                  Danger Action
                </Button>
                <Button variant="gold" isLoading>
                  Loading
                </Button>
              </div>
            </Card>

            {/* Button Sizes */}
            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Button Sizes
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="gold" size="xs">Size XS</Button>
                <Button variant="gold" size="sm">Size SM</Button>
                <Button variant="gold" size="md">Size MD (Default)</Button>
                <Button variant="gold" size="lg">Size LG</Button>
                <Button variant="gold" size="xl">Size XL (Hero CTA)</Button>
              </div>
            </Card>

            {/* Icon Buttons (Min 44px Touch Target) */}
            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Icon Buttons (44px Minimum Touch Targets)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <IconButton variant="glass" aria-label="Wishlist" badge={3}>
                  <Heart className="w-5 h-5" />
                </IconButton>
                <IconButton variant="surface" aria-label="Shopping Bag" badge={1}>
                  <ShoppingBag className="w-5 h-5" />
                </IconButton>
                <IconButton variant="gold" aria-label="Search">
                  <Search className="w-5 h-5" />
                </IconButton>
                <IconButton variant="ghost" aria-label="User Profile">
                  <User className="w-5 h-5" />
                </IconButton>
                <IconButton variant="danger" aria-label="Delete">
                  <XCircle className="w-5 h-5" />
                </IconButton>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 4: Badges & Status Pills */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Sparkles className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              4. Badges & Status Pills
            </h2>
          </div>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="gold" dot glow>BESTSELLER</Badge>
              <Badge variant="gold">15% OFF</Badge>
              <Badge variant="success" dot>IN STOCK</Badge>
              <Badge variant="warning" dot>LOW STOCK (2 LEFT)</Badge>
              <Badge variant="danger" dot>SOLD OUT</Badge>
              <Badge variant="purple">LIMITED RUN</Badge>
              <Badge variant="cyan">OFFICIAL IMPORT</Badge>
              <Badge variant="neutral">PRE-ORDER</Badge>
            </div>
          </Card>
        </section>

        {/* Section 5: Form Inputs & Tabs */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Maximize2 className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              5. Form Controls, Inputs & Navigation Tabs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Form Inputs
              </span>
              <Input
                label="Search Collectibles"
                placeholder="Search figures, anime, scale..."
                leftIcon={<Search className="w-4 h-4" />}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Input
                label="Email Address"
                placeholder="collector@fictionfigure.in"
                hint="We'll send exclusive drop announcements to this address."
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                error={inputText.length > 0 && inputText.length < 5 ? "Please enter a valid format." : undefined}
              />
            </Card>

            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Segmented Tabs
              </span>
              <div className="space-y-4">
                <Tabs
                  tabs={showcaseTabs}
                  activeTab={activeTab}
                  onChange={(id) => setActiveTab(id)}
                />
                <div className="p-4 rounded-xl bg-[#0E0F13] border border-white/[0.06] text-xs text-[#94A3B8]">
                  Active Tab: <span className="text-[#F5C518] font-bold uppercase font-mono">{activeTab}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 6: Product Card Foundation Preview */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <ShoppingBag className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              6. Collectible Product Card Foundation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard product={sampleProduct} />
            <ProductCardSkeleton />
          </div>
        </section>

        {/* Section 7: Loading Skeletons & Empty States */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Flame className="w-5 h-5 text-[#F5C518]" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              7. Loading Skeletons & Empty States
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                Order Row Skeleton
              </span>
              <OrderRowSkeleton />
              <OrderRowSkeleton />
            </Card>

            <Card className="flex items-center justify-center">
              <EmptyState
                icon={<Heart className="w-6 h-6" />}
                title="Your Wishlist is Empty"
                description="Save your most anticipated figures to keep track of stock and price changes."
                actionLabel="Explore Vault"
                actionHref="/shop"
              />
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
