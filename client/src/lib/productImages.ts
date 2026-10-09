/**
 * Product gallery rules shared by the admin image manager and the storefront.
 * Pure functions with no imports, so they can be unit-tested directly with `node --test`.
 *
 * The primary/cover image is always the first item in the list (the server stores it as
 * sortOrder 0 / isPrimary).
 */

/** Maximum images per product. Keep in sync with server/src/utils/productImages.ts. */
export const MAX_PRODUCT_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** Validates a picked/dropped/pasted file. Returns an error message, or null when it is fine. */
export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !ACCEPTED_IMAGE_EXTENSIONS.includes(ext)) {
    return `${file.name || "File"}: only JPG, PNG or WEBP images are allowed.`;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name || "File"} is larger than 5 MB.`;
  if (file.size === 0) return `${file.name || "File"} is empty.`;
  return null;
}

/** Identity used to skip re-uploading the same file in one editing session. */
export const fileFingerprint = (file: { name: string; size: number; lastModified?: number }) =>
  `${file.name}:${file.size}:${file.lastModified ?? 0}`;

/** Splits picked files into ones to upload and ones rejected, honouring the remaining slots. */
export function planUploads<F extends { name: string; type: string; size: number }>(
  files: F[],
  slotsLeft: number
): { accepted: F[]; errors: string[] } {
  const accepted: F[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const err = validateImageFile(file);
    if (err) {
      errors.push(err);
      continue;
    }
    if (accepted.length >= slotsLeft) {
      errors.push(`${file.name}: a product can have at most ${MAX_PRODUCT_IMAGES} images.`);
      continue;
    }
    accepted.push(file);
  }
  return { accepted, errors };
}

/** Appends URLs that are not already present (no duplicates), up to the maximum. */
export function addImageUrls(list: string[], urls: string[], max = MAX_PRODUCT_IMAGES): string[] {
  const next = [...list];
  for (const u of urls) {
    const url = (u || "").trim();
    if (!url || next.includes(url) || next.length >= max) continue;
    next.push(url);
  }
  return next;
}

export function removeImageAt(list: string[], index: number): string[] {
  return list.filter((_, i) => i !== index);
}

export function moveImage(list: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Makes an existing image the cover by moving it to the front (no re-upload). */
export function makePrimary(list: string[], index: number): string[] {
  return moveImage(list, index, 0);
}

/** Swaps one image for a new URL in place. If the new URL already exists elsewhere, the slot is dropped instead. */
export function replaceImageAt(list: string[], index: number, url: string): string[] {
  if (index < 0 || index >= list.length) return list;
  const existing = list.indexOf(url);
  if (existing !== -1 && existing !== index) return removeImageAt(list, index);
  const next = [...list];
  next[index] = url;
  return next;
}

/* ---------- storefront ---------- */

interface GalleryImage {
  url: string;
}

/** Image to show on cards, in the cart and at checkout: the variant's own image, else the cover. */
export function primaryImageUrl(images: GalleryImage[] | undefined, variantImageUrl?: string | null): string {
  return variantImageUrl || images?.[0]?.url || "";
}

/** Gallery position that matches a variant's image, or -1 when the variant uses an image outside the gallery. */
export function galleryIndexForVariant(images: GalleryImage[] | undefined, variantImageUrl?: string | null): number {
  if (!variantImageUrl || !images?.length) return 0;
  return images.findIndex((img) => img.url === variantImageUrl);
}

export const wrapIndex = (index: number, length: number) => (length > 0 ? ((index % length) + length) % length : 0);
