import React from "react";
import { SectionHeading } from "@/components/home/SectionHeading";
import { CategoryTile, ViewAllTile, CategoryTileData } from "@/components/collection/CategoryTile";

export type CategoryItem = CategoryTileData & { description?: string | null };

interface CategoryShowcaseProps {
  categories: CategoryItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  viewAllText?: string;
  viewAllUrl?: string;
  /** full = six-up poster row; compact = sits beside another editorial block */
  layout?: "full" | "compact";
}

export function CategoryShowcase({
  categories,
  eyebrow = "CURATED UNIVERSE",
  title = "SHOP BY CATEGORY",
  description,
  viewAllText = "View All",
  viewAllUrl = "/collections",
  layout = "full",
}: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) return null;

  const isCompact = layout === "compact";
  const shown = categories.slice(0, isCompact ? 6 : 12);
  const cols = isCompact ? Math.min(shown.length + 1, 3) : 6;
  const needsFiller = shown.length % cols !== 0;

  const gridCols = isCompact
    ? cols === 2
      ? "grid-cols-2"
      : "grid-cols-2 sm:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";

  return (
    <section aria-label={title} className="h-full flex flex-col gap-4 lg:gap-5">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        linkText={viewAllText}
        linkUrl={viewAllUrl}
      />
      <div className={`grid ${gridCols} gap-3 lg:gap-4 flex-1`}>
        {shown.map((cat, i) => (
          <CategoryTile
            key={cat.id}
            category={cat}
            priority={i < 3}
            aspect={isCompact && shown.length < 3 ? "h-full min-h-[260px]" : "aspect-[4/5]"}
          />
        ))}
        {needsFiller && (
          <ViewAllTile
            href={viewAllUrl}
            eyebrow="Explore"
            title="All Collections"
            aspect={isCompact && shown.length < 3 ? "min-h-[260px]" : "aspect-[4/5]"}
          />
        )}
      </div>
    </section>
  );
}
