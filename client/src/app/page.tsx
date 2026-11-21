import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { SearchModal } from "@/components/search/SearchModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getProducts, getCategories } from "@/lib/services/productService";
import { API_BASE } from "@/lib/api";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { resolveHeroSlides } from "@/lib/heroSlides";
import { GiftFinder, CollectorJournal } from "@/components/home/DiscoverySections";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ProductSection } from "@/components/home/ProductSection";
import { BrandFaq } from "@/components/home/BrandFaq";
import { OG_IMAGE, OPEN_GRAPH_DEFAULTS, faqPageSchema, jsonLd, organizationSchema, storeFactsFromSettings, storeFaqs, websiteSchema } from "@/lib/seo";
import { DEFAULT_HOMEPAGE_CMS_CONFIG } from "@/types/cms";

export const revalidate = 60; // 60s Vercel Edge ISR Cache

export const metadata: Metadata = {
  title: { absolute: "Fiction Figures | Anime Figures & Collectibles Store in India" },
  description:
    "Shop anime figures, action figures, collectible statues, keychains and mystery boxes at Fiction Figures (fictionfigures.in). Pan-India delivery, Cash on Delivery and UPI.",
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    url: "/",
    title: "Fiction Figures | Anime Figures & Collectibles Store in India",
    description: "Shop anime figures, action figures, collectible statues, keychains and mystery boxes at Fiction Figures. Pan-India delivery, Cash on Delivery and UPI.",
    images: [OG_IMAGE],
  },
};

async function getHeroSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return { settings: {}, featuredProduct: null };
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch store settings for homepage hero:", err);
    return { settings: {}, featuredProduct: null };
  }
}


export default async function HomePage() {
 const [newArrivalsRes, popularRes, categories, heroData] = await Promise.all([
  getProducts({sortBy:"newest",limit:8}),getProducts({limit:8}),getCategories(),getHeroSettings(),
 ]);
 const settings=heroData?.settings || {};
 const config=heroData?.homepageCmsConfig || DEFAULT_HOMEPAGE_CMS_CONFIG;
 const products=newArrivalsRes?.products || [];
 const seen=new Set(products.map((product:any)=>product.id));
 const more=(popularRes?.products || []).filter((product:any)=>!seen.has(product.id));
 const selected:string[]=config?.shopByCategory?.selectedCategoryIds || [];
 const overrides:Record<string,string>=config?.shopByCategory?.imageOverrides || {};
 const worlds=(selected.length?selected.map(id=>(categories||[]).find((category:any)=>category.id===id)).filter(Boolean):categories||[]).map((category:any)=>overrides[category.id]?{...category,imageUrl:overrides[category.id]}:category);
 const facts=storeFactsFromSettings(settings);const faqs=storeFaqs(facts);
 const campaignSlides=resolveHeroSlides(heroData || {});
 const heroSection=config.sectionsOrder?.find((section:any)=>section.id==="hero");
 return <><Header/><SearchModal/><CartDrawer/>
  <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationSchema(facts))}/><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(websiteSchema())}/><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqPageSchema(faqs))}/>
  <main className="concept-home flex-1 bg-background text-foreground"><h1 className="sr-only">Fiction Figures — Anime Figures, Manga &amp; Collectibles in India</h1>
   {settings.homepage_hero_enabled!=="false" && heroSection?.enabled!==false && <HeroCarousel slides={campaignSlides} secondaryLabel={settings.homepage_hero_secondary_label} secondaryUrl={settings.homepage_hero_secondary_url}/>}
   <div className="ff-container concept-home-body">
    {config?.shopByCategory?.enabled!==false && <CategoryShowcase categories={worlds} title="Find your world"/>}
    {config?.newArrivals?.enabled!==false && <ProductSection title="Little finds. Big happiness." products={products} viewAllUrl="/shop?sortBy=newest" viewAllText="Explore new arrivals"/>}
    <GiftFinder/>
    {config?.moreToCollect?.enabled!==false && more.length>0 && <ProductSection title="More for your little universe." products={more}/>}
    <CollectorJournal/><BrandFaq faqs={faqs}/>
   </div>
  </main><Footer showValueStrip={false}/></>;
}
