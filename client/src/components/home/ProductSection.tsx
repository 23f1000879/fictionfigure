"use client";
import React from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
export interface ProductItem {
 id:string;name:string;slug:string;brand:string;price:number;compareAtPrice?:number|null;rating?:number|null;reviewCount?:number|null;category?:{name:string};images:{url:string;altText?:string|null}[];variants?:{id:string;title:string;price:number;sku:string;inventoryCount:number}[];
}
interface ProductSectionProps {eyebrow?:string;title:string;description?:string;viewAllUrl?:string;viewAllText?:string;products:ProductItem[];layout?:"full"|"compact";}
export function ProductSection({title,description,viewAllUrl="/shop",viewAllText="Shop all",products}:ProductSectionProps){
 if(!products.length)return null;
 return <section aria-label={title}><div className="flex flex-wrap items-end justify-between gap-3 mb-5"><div><h2 className="concept-section-title !mb-0">{title}</h2>{description && <p className="text-foreground-secondary mt-2">{description}</p>}</div><Link href={viewAllUrl} className="concept-text-link">{viewAllText}</Link></div><div className="concept-products-grid">{products.slice(0,8).map(product=><ProductCard key={product.id} product={product}/>)}</div></section>;
}
