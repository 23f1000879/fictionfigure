/**
 * Product image list handling shared by the admin create/update routes.
 *
 * Model (no schema change): one ProductImage row per image, ordered by `sortOrder`.
 * The primary/cover image is always sortOrder 0 with `isPrimary: true`, which is what
 * the storefront, cart, checkout and order history already read (`images[0]` after
 * ordering by sortOrder).
 */

/** Maximum images per product. Keep in sync with client/src/lib/productImages.ts. */
export const MAX_PRODUCT_IMAGES = 8;

export interface ProductImageInput {
  url: string;
  altText?: string | null;
}

type RawImage = string | { url?: unknown; altText?: unknown; isPrimary?: unknown } | null | undefined;

export type NormalizeResult = { ok: true; images: ProductImageInput[] } | { ok: false; error: string };

const isAllowedUrl = (url: string) => /^https?:\/\/\S+$/i.test(url) || /^\/uploads\/\S+$/.test(url);

/**
 * Validates and normalises an `images` payload.
 * Accepts the legacy string[] format and `{ url, altText?, isPrimary? }[]`.
 * Order is preserved; an item flagged `isPrimary` is moved to the front; duplicates are dropped.
 */
export function normalizeProductImages(raw: unknown, max = MAX_PRODUCT_IMAGES): NormalizeResult {
  if (!Array.isArray(raw)) return { ok: false, error: "Images must be a list." };

  const seen = new Set<string>();
  const images: (ProductImageInput & { isPrimary: boolean })[] = [];

  for (const item of raw as RawImage[]) {
    if (!item) continue;
    const url = (typeof item === "string" ? item : typeof item.url === "string" ? item.url : "").trim();
    if (!url) continue;
    if (!isAllowedUrl(url)) return { ok: false, error: `Invalid image URL: ${url.slice(0, 80)}` };
    if (seen.has(url)) continue;
    seen.add(url);
    const altText = typeof item === "object" && typeof item.altText === "string" ? item.altText.trim().slice(0, 200) : null;
    const isPrimary = typeof item === "object" && item.isPrimary === true;
    images.push({ url, altText: altText || null, isPrimary });
  }

  if (images.length > max) return { ok: false, error: `A product can have at most ${max} images.` };

  const primaryIdx = images.findIndex((i) => i.isPrimary);
  if (primaryIdx > 0) images.unshift(images.splice(primaryIdx, 1)[0]);

  return { ok: true, images: images.map(({ url, altText }) => ({ url, altText })) };
}

/** Rows for ProductImage.createMany / nested create. */
export function toImageRows(images: ProductImageInput[], productName: string) {
  return images.map((img, idx) => ({
    url: img.url,
    altText: img.altText || (idx === 0 ? productName : `${productName} — view ${idx + 1}`),
    sortOrder: idx,
    isPrimary: idx === 0,
  }));
}

/** The subset of the Prisma transaction client used by `replaceProductImages`. */
export interface ImageTx {
  productImage: {
    findMany(args: any): Promise<{ url: string; sortOrder: number }[]>;
    deleteMany(args: any): Promise<unknown>;
    createMany(args: any): Promise<unknown>;
  };
  productVariant: {
    findMany(args: any): Promise<{ id: string; imageUrl: string | null }[]>;
    update(args: any): Promise<unknown>;
  };
}

/**
 * Replaces a product's gallery inside a transaction and keeps variant images in step.
 *
 * Variants store their own `imageUrl` (cart/checkout prefer it). Variants that were showing the
 * old cover, a gallery image that has been removed, or nothing at all are pointed at the new
 * cover. Variant-specific images (never part of the gallery) are left alone.
 */
export async function replaceProductImages(tx: ImageTx, productId: string, images: ProductImageInput[], productName: string) {
  const before = await tx.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" }, select: { url: true, sortOrder: true } });
  const oldUrls = new Set(before.map((i) => i.url));
  const newUrls = new Set(images.map((i) => i.url));
  const newPrimary = images[0]?.url ?? null;

  await tx.productImage.deleteMany({ where: { productId } });
  if (images.length > 0) {
    await tx.productImage.createMany({ data: toImageRows(images, productName).map((row) => ({ ...row, productId })) });
  }

  const variants = await tx.productVariant.findMany({ where: { productId }, select: { id: true, imageUrl: true } });
  for (const v of variants) {
    const current = v.imageUrl || null;
    const followsGallery = !current || (oldUrls.has(current) && (!newUrls.has(current) || current === before[0]?.url));
    if (followsGallery && current !== newPrimary) {
      await tx.productVariant.update({ where: { id: v.id }, data: { imageUrl: newPrimary } });
    }
  }
}
