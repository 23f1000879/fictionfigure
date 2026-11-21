import { collectionLabel } from "@/lib/collectionLabel";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CategoryTileData } from "@/components/collection/CategoryTile";
export type CategoryItem = CategoryTileData & { description?: string | null };
interface CategoryShowcaseProps { categories: CategoryItem[]; eyebrow?: string; title?: string; description?: string; viewAllText?: string; viewAllUrl?: string; layout?: "full"|"compact"; }
export function CategoryShowcase({categories,title="Find your world",viewAllUrl="/collections"}:CategoryShowcaseProps) {
 if(!categories.length)return null;
 return <section aria-label={title}><div className="flex items-end justify-between gap-4"><h2 className="concept-section-title">{title}</h2>{categories.length>6 && <Link href={viewAllUrl} className="concept-text-link mb-6">Explore all</Link>}</div><div className="concept-worlds-grid">
 {categories.slice(0,6).map(category=><Link key={category.id} href={`/collections/${category.slug}`} className="concept-world-card"><div className="concept-world-image">{category.imageUrl || category.image ? <Image src={(category.imageUrl || category.image)!} alt="" fill sizes="(max-width: 767px) 30vw, 200px"/>:<Sparkles aria-hidden/>}</div><h3>{collectionLabel(category.name)}</h3></Link>)}
 </div></section>;
}
