import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FolderTree } from "lucide-react";

export interface CategoryTileData {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  image?: string | null;
  _count?: { products?: number };
}

interface CategoryTileProps {
  category: CategoryTileData;
  href?: string;
  /** Tailwind aspect class for the poster. */
  aspect?: string;
  size?: "sm" | "lg";
  priority?: boolean;
  sizes?: string;
}

/** Collection poster: artwork, bottom gradient, condensed series title, product count, circular arrow. */
export function CategoryTile({
  category,
  href,
  aspect = "aspect-[4/5]",
  size = "sm",
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
}: CategoryTileProps) {
  const imageSrc = category.imageUrl || category.image;
  const count = category._count?.products;

  return (
    <Link
      href={href || `/collections/${category.slug}`}
      className={`group relative block ${aspect} overflow-hidden rounded-[10px] border border-white/[0.1] bg-[#111318] hover:border-white/25 transition-colors`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={category.name}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FolderTree className="w-10 h-10 text-white/15" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-[#08090B]/35 to-transparent" />

      <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 ${size === "lg" ? "p-5" : "p-3.5"}`}>
        <div className="min-w-0">
          <h3
            className={`ff-display text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-2 ${
              size === "lg" ? "text-[26px] sm:text-[30px]" : "text-[18px] sm:text-[20px]"
            }`}
          >
            {category.name}
          </h3>
          {count !== undefined && (
            <p className={`mt-1 text-[#F7F7F5]/80 ${size === "lg" ? "text-[12px]" : "text-[11px]"}`}>
              {count} {count === 1 ? "Product" : "Products"}
            </p>
          )}
        </div>
        <span className="ff-circle-arrow shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

interface ViewAllTileProps {
  href: string;
  eyebrow?: string;
  title: string;
  aspect?: string;
}

/** Fills the remaining slot of a short grid with a real destination instead of dead space. */
export function ViewAllTile({ href, eyebrow, title, aspect = "" }: ViewAllTileProps) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between h-full min-h-[180px] ${aspect} overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#0D0E12] p-4 sm:p-5 hover:border-[#F5C518]/40 transition-colors`}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#F5C518]/[0.07] blur-2xl pointer-events-none" />
      {eyebrow && <p className="ff-eyebrow relative">{eyebrow}</p>}
      <div className="relative flex items-end justify-between gap-3">
        <p className="ff-display text-[20px] sm:text-[22px] text-white">{title}</p>
        <span className="ff-circle-arrow shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
