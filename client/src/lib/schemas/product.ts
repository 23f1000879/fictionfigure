import { z } from "zod";

export const productFilterSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  franchise: z.string().optional(),
  material: z.string().optional(),
  scale: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  featuredOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(["featured", "newest", "price-asc", "price-desc", "popular"]).default("featured"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

export const productInputSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  brand: z.string().min(1, "Brand is required"),
  shortDescription: z.string().min(5),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().optional().nullable(),
  costPrice: z.coerce.number().optional().nullable(),
  sku: z.string().min(2),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  featured: z.boolean().default(false),
  material: z.string().optional(),
  scale: z.string().optional(),
  franchise: z.string().optional(),
  images: z.array(z.string().url()).min(1, "At least one image URL is required"),
  variants: z.array(
    z.object({
      title: z.string().min(1),
      sku: z.string().min(1),
      price: z.coerce.number().positive(),
      compareAtPrice: z.coerce.number().optional().nullable(),
      inventoryCount: z.coerce.number().int().nonnegative().default(10),
      imageUrl: z.string().optional(),
    })
  ).min(1, "At least one variant is required"),
});

export type ProductInput = z.infer<typeof productInputSchema>;
