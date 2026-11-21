"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, Sun, Moon, Truck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useStoreCategories } from "@/lib/useStoreCategories";

const links = [{href:"/shop",label:"Shop all"},{href:"/collections",label:"Anime worlds"},{href:"/shop?query=mystery",label:"Mystery boxes"},{href:"/shop?maxPrice=499",label:"Under ₹499"},{href:"/shop?sortBy=newest",label:"New arrivals"}];
const iconClass = "relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a793ee]";
function Count({value}:{value:number}) { return value > 0 ? <span className="absolute top-0 right-0 bg-[#f83c98] text-white text-xs font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">{value > 99 ? "99+" : value}</span> : null; }

export function Header() {
 const pathname=usePathname();
 const {cartCount,setIsCartOpen,setIsSearchOpen}=useCart();
 const {wishlistCount}=useWishlist();
 const {freeShippingThreshold}=useSettings();
 const {theme,toggleTheme}=useTheme();
 const [open,setOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const [loggedIn,setLoggedIn]=useState(false);
 const {categories}=useStoreCategories(open);
 const drawerRef=useRef<HTMLDivElement>(null);
 const menuRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setMounted(true);setLoggedIn(Boolean(localStorage.getItem("fictionfigure_token")));},[]);
 useEffect(()=>{setOpen(false);},[pathname]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{const target=event.target as HTMLElement;if(event.key==="/" && !target.closest("input,textarea,[contenteditable='true']")){event.preventDefault();setIsSearchOpen(true);}};
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[setIsSearchOpen]);
 useEffect(()=>{
  if(!open)return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){setOpen(false);menuRef.current?.focus();}
   if(event.key==="Tab"){
    const items=drawerRef.current?.querySelectorAll<HTMLElement>("a[href],button:not(:disabled)");if(!items?.length)return;
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
   }
  };
  window.addEventListener("keydown",onKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey);};
 },[open]);
 const close=()=>{setOpen(false);menuRef.current?.focus();};
 return <header className="concept-header sakuga-header sticky top-0 z-40 bg-surface-glass backdrop-blur-xl border-b border-border">
  <div className="ff-container concept-header-main">
   <Link href="/" aria-label="Fiction Figures home"><BrandLogo priority /></Link>
   <button type="button" onClick={()=>setIsSearchOpen(true)} className="concept-header-search" aria-label="Search figures, anime and series"><Search size={22} aria-hidden /><span>Search characters, figures, manga...</span><kbd className="ml-auto text-xs border border-border-light rounded px-1.5">/</kbd></button>
   <div className="concept-header-tools">
    <button type="button" onClick={()=>setIsSearchOpen(true)} className={`${iconClass} md:hidden`} aria-label="Search"><Search size={23}/></button>
    <button type="button" onClick={toggleTheme} className={`${iconClass} concept-theme-toggle hidden md:flex`} aria-label={theme==="night"?"Switch to Day theme":"Switch to Night theme"}>{theme==="night"?<Sun size={21}/>:<Moon size={21}/>}</button>
    <Link href={loggedIn?"/account":"/login"} className={`${iconClass} concept-desktop-icon hidden md:flex`} aria-label={loggedIn?"Account":"Sign in"}><User size={24}/></Link>
    <Link href="/account/wishlist" className={`${iconClass} concept-desktop-icon hidden md:flex`} aria-label="Wishlist"><Heart size={24}/><Count value={wishlistCount}/></Link>
    <button type="button" onClick={()=>setIsCartOpen(true)} className={iconClass} aria-label="Open cart"><ShoppingBag size={24}/><Count value={cartCount}/></button>
    <button type="button" ref={menuRef} onClick={()=>setOpen(!open)} className={`${iconClass} lg:hidden`} aria-label="Toggle navigation menu" aria-expanded={open} aria-controls="concept-mobile-menu"><Menu size={24}/></button>
   </div>
  </div>
  <nav className="concept-nav" aria-label="Primary">{links.map(link=><Link key={link.label} href={link.href} aria-current={pathname===link.href?"page":undefined}>{link.label}</Link>)}</nav>
  <div className="concept-announcement"><Truck aria-hidden/><span>{freeShippingThreshold > 0 ? `Free shipping on orders ₹${freeShippingThreshold.toLocaleString("en-IN")}+` : "Collect what you love. Ships across India."}</span></div>
  {mounted && open && createPortal(<div className="fixed inset-0 z-[100] lg:hidden">
   <div className="absolute inset-0 bg-[#211544]/55 backdrop-blur-sm" onClick={close} aria-hidden/>
   <div id="concept-mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation" ref={drawerRef} className="absolute right-0 inset-y-0 w-[90%] max-w-[360px] bg-surface border-l border-border-light p-5 overflow-y-auto">
    <div className="flex items-center justify-between gap-3 pb-6"><BrandLogo className="h-8"/><button type="button" className={iconClass} onClick={close} aria-label="Close navigation menu"><X/></button></div>
    <nav aria-label="Mobile">{links.map(link=><Link key={link.label} href={link.href} onClick={close} className="flex items-center min-h-12 py-3 border-b border-border text-base font-semibold">{link.label}</Link>)}</nav>
    {categories.length > 0 && <div className="py-5 space-y-2"><p className="ff-eyebrow mb-3">Find your world</p>{categories.map(category=><Link href={`/collections/${category.slug}`} key={category.id} onClick={close} className="block py-2 text-sm text-foreground-secondary">{category.name}</Link>)}</div>}
    <div className="pt-5 border-t border-border space-y-2"><Link href={loggedIn?"/account":"/login"} onClick={close} className="flex items-center gap-3 py-3"><User size={20}/>{loggedIn?"My account":"Sign in"}</Link><Link href="/account/wishlist" onClick={close} className="flex items-center gap-3 py-3"><Heart size={20}/>Wishlist</Link><Link href="/about" onClick={close} className="block py-3">About Fiction Figures</Link><button type="button" onClick={toggleTheme} className="flex gap-3 items-center py-3">{theme==="night"?<Sun size={20}/>:<Moon size={20}/>}Switch to {theme==="night"?"day":"night"} theme</button></div>
   </div>
  </div>,document.body)}
 </header>;
}
