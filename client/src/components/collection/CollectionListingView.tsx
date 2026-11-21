"use client";

import { collectionLabel } from "@/lib/collectionLabel";
import React, { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";
import { ArtworkFrame } from "@/components/ui/Artwork";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  _count?: {
    products?: number;
  };
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: { name: string; slug?: string };
  images: { url: string; altText?: string | null }[];
  variants?: { id: string; title: string; price: number; sku: string; inventoryCount: number }[];
}

interface CollectionListingViewProps {
  title: string;
  eyebrow?: string;
  description?: string;
  categoryImage?: string | null;
  activeCategorySlug?: string;
  baseUrl?: string; // "/shop" or "/collections"
  products: ProductData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  categories: CategoryData[];
  brands: string[];
  franchises: string[];
}

export function CollectionListingView({
  title,
  eyebrow = "THE VAULT",
  description,
  categoryImage,
  activeCategorySlug = "",
  baseUrl = "/shop",
  products,
  totalCount,
  totalPages,
  currentPage,
  categories,
  brands,
  franchises,
}: CollectionListingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Active Filter Values
  const currentCategory = activeCategorySlug || searchParams.get("category") || "";
  const currentBrand = searchParams.get("brand") || "";
  const currentFranchise = searchParams.get("franchise") || "";
  const currentQuery = searchParams.get("query") || "";
  const inStockOnly = searchParams.get("inStockOnly") === "true";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  useEffect(() => {
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Lock scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  // Navigation & Parameter Management Helper.
  // Filter changes reset to page 1; an explicit page change is preserved.
  const applyParams = (updatedParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updatedParams).forEach(([key, val]) => {
      if (val !== null && val.trim() !== "") {
        params.set(key, val.trim());
      } else {
        params.delete(key);
      }
    });
    if (!("page" in updatedParams)) params.set("page", "1");
    startTransition(() => {
      router.push(`${baseUrl}?${params.toString()}`);
    });
  };

  const handlePriceApply = () => {
    applyParams({
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    });
    setIsMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    startTransition(() => {
      if (activeCategorySlug) {
        router.push(`/collections/${activeCategorySlug}`);
      } else {
        router.push(baseUrl);
      }
    });
    setIsMobileFilterOpen(false);
  };

  const hasActiveFilters =
    Boolean(currentCategory && !activeCategorySlug) ||
    Boolean(currentBrand) ||
    Boolean(currentFranchise) ||
    Boolean(currentQuery) ||
    inStockOnly ||
    Boolean(minPriceParam) ||
    Boolean(maxPriceParam);

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  const startItemIdx = totalCount === 0 ? 0 : (currentPage - 1) * 12 + 1;
  const endItemIdx = Math.min(currentPage * 12, totalCount);

  const isCollectionRoute = baseUrl.startsWith("/collections");
  const crumbs = [
    { label: "Home", href: "/" },
    isCollectionRoute ? { label: "Collections", href: "/collections" } : { label: "Shop", href: "/shop" },
  ];


  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileFilterOpen(false);
      if (event.key === "Tab") {
        const controls = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>("button,input,select,a[href],summary") || []).filter(control=>control.getClientRects().length>0);
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); if(trigger?.isConnected)trigger.focus(); };
  }, [isMobileFilterOpen]);

  const sortSelect = <select value={sortBy} onChange={event=>applyParams({sortBy:event.target.value})} aria-label="Sort products">
    <option value="newest">Sort: Newest</option><option value="price-asc">Price: Low to high</option><option value="price-desc">Price: High to low</option><option value="featured">Featured</option><option value="name-asc">Name: A–Z</option>
  </select>;

  const filters = (slot: string) => <div className="concept-filter-sidebar">
    {!activeCategorySlug && categories.length>0 && <details open><summary>Category<ChevronDown aria-hidden/></summary>
      <label className="concept-filter-option"><input type="radio" name={`category-${slot}`} checked={!currentCategory} onChange={()=>applyParams({category:null})}/>All collectibles</label>
      {categories.map(category=><label key={category.id} className="concept-filter-option"><input type="radio" name={`category-${slot}`} checked={currentCategory===category.slug} onChange={()=>applyParams({category:category.slug})}/><span>{collectionLabel(category.name)}</span></label>)}
    </details>}
    <details open><summary>Price<ChevronDown aria-hidden/></summary><form onSubmit={event=>{event.preventDefault();handlePriceApply();}}>
      <div className="concept-price-inputs"><input type="number" min="0" inputMode="numeric" aria-label={`Minimum price ${slot}`} placeholder="Min ₹" value={minPriceInput} onChange={event=>setMinPriceInput(event.target.value)}/><input type="number" min="0" inputMode="numeric" aria-label={`Maximum price ${slot}`} placeholder="Max ₹" value={maxPriceInput} onChange={event=>setMaxPriceInput(event.target.value)}/></div>
      <button type="submit" className="ff-btn ff-btn-outline w-full !min-h-10 !py-2 mt-3">Apply price</button>
    </form></details>
    <details open><summary>Availability<ChevronDown aria-hidden/></summary><label className="concept-filter-option"><input type="checkbox" checked={inStockOnly} onChange={event=>applyParams({inStockOnly:event.target.checked?"true":null})}/>In stock only</label></details>
    {brands.length>0 && <details><summary>Brand<ChevronDown aria-hidden/></summary>{brands.map(brand=><label key={brand} className="concept-filter-option"><input type="radio" name={`brand-${slot}`} checked={currentBrand===brand} onChange={()=>applyParams({brand})}/>{brand}</label>)}{currentBrand && <button className="concept-text-link" onClick={()=>applyParams({brand:null})}>Clear brand</button>}</details>}
    {franchises.length>0 && <details><summary>Anime world<ChevronDown aria-hidden/></summary>{franchises.map(franchise=><label key={franchise} className="concept-filter-option"><input type="radio" name={`franchise-${slot}`} checked={currentFranchise===franchise} onChange={()=>applyParams({franchise})}/>{franchise}</label>)}{currentFranchise && <button className="concept-text-link" onClick={()=>applyParams({franchise:null})}>Clear anime world</button>}</details>}
    <button type="button" onClick={handleResetFilters} className="concept-text-link">Reset filters</button>
  </div>;

  return <div className="concept-shop ff-container">
    <nav aria-label="Breadcrumb" className="concept-shop-breadcrumb"><Link href="/">Home</Link><span aria-hidden> / </span><span aria-current="page">{isCollectionRoute?title:"Shop"}</span></nav>
    <div className="concept-shop-heading"><div><h1>{currentQuery?`Results for “${currentQuery}”`:activeCategorySlug?collectionLabel(title):"Find your next favourite."}</h1><p>{activeCategorySlug && description?description:"Small collectibles. Big main-character energy."}</p></div>
    {!activeCategorySlug && categories.length>0 && <div className="concept-filter-pills" aria-label="Shop by collection"><button type="button" aria-pressed={!currentCategory} onClick={()=>applyParams({category:null})}>All</button>{categories.slice(0,6).map(category=><button type="button" key={category.id} aria-pressed={currentCategory===category.slug} onClick={()=>applyParams({category:category.slug})}>{collectionLabel(category.name)}</button>)}</div>}</div>
    <div className="concept-shop-layout">{filters("desktop")}
      <div className="concept-shop-results" aria-busy={isPending}>
        <div className="concept-results-toolbar"><div><h2>Browse collectibles</h2><small aria-live="polite">{totalCount?`${startItemIdx}–${endItemIdx} of ${totalCount} finds`:"No matching finds"}</small></div><button type="button" className="concept-filter-toggle" onClick={()=>setIsMobileFilterOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={18}/>Filters{hasActiveFilters?" · Active":""}</button>{sortSelect}</div>
        {hasActiveFilters && <div className="concept-active-filters">
          {currentQuery && <button onClick={()=>applyParams({query:null})}>Search: {currentQuery}<X size={14}/></button>}
          {currentCategory && !activeCategorySlug && <button onClick={()=>applyParams({category:null})}>{activeCategoryObj?.name||currentCategory}<X size={14}/></button>}
          {currentBrand && <button onClick={()=>applyParams({brand:null})}>{currentBrand}<X size={14}/></button>}
          {currentFranchise && <button onClick={()=>applyParams({franchise:null})}>{currentFranchise}<X size={14}/></button>}
          {inStockOnly && <button onClick={()=>applyParams({inStockOnly:null})}>In stock<X size={14}/></button>}
          {(minPriceParam||maxPriceParam) && <button onClick={()=>applyParams({minPrice:null,maxPrice:null})}>{minPriceParam?formatPrice(Number(minPriceParam)):"₹0"} – {maxPriceParam?formatPrice(Number(maxPriceParam)):"Any price"}<X size={14}/></button>}
          <button onClick={handleResetFilters}>Clear all</button>
        </div>}
        {products.length?<div className={`concept-shop-grid ${isPending?"opacity-50":""}`}>{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>:<div className="concept-shop-empty"><ShoppingBag className="mx-auto text-[#a48cdb]" size={36}/><h2 className="font-bold text-xl mt-4">No finds just yet</h2><p>Try another collection or adjust your filters.</p><button type="button" onClick={handleResetFilters} className="ff-btn ff-btn-gold">Clear filters</button></div>}
        {totalPages>1 && <nav className="concept-pagination" aria-label="Product pages"><button type="button" className="ff-btn ff-btn-outline disabled:opacity-40" disabled={currentPage<=1} onClick={()=>applyParams({page:String(currentPage-1)})}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" className="ff-btn ff-btn-outline disabled:opacity-40" disabled={currentPage>=totalPages} onClick={()=>applyParams({page:String(currentPage+1)})}>Next</button></nav>}
        <div className="concept-shop-banner"><div><strong>Not sure where to start?</strong><span>Explore little gifts under ₹499.</span></div><Link href="/shop?maxPrice=499" className="ff-btn ff-btn-outline">Find a little gift</Link></div>
      </div>
    </div>
    {isMobileFilterOpen && <div className="concept-filter-modal"><div className="concept-filter-backdrop" onClick={()=>setIsMobileFilterOpen(false)} aria-hidden/><div className="concept-filter-sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="Filter collectibles"><div className="concept-filter-sheet-heading"><h2>Find your favourites</h2><button type="button" autoFocus onClick={()=>setIsMobileFilterOpen(false)} aria-label="Close filters"><X size={20}/></button></div>{filters("mobile")}<button type="button" onClick={()=>{handlePriceApply();}} className="ff-btn ff-btn-gold w-full mt-6">Show results</button></div></div>}
  </div>;
}
