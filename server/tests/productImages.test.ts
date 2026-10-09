import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PRODUCT_IMAGES,
  normalizeProductImages,
  replaceProductImages,
  toImageRows,
  type ImageTx,
} from "../src/utils/productImages.js";

const url = (n: number) => `https://res.cloudinary.com/demo/image/upload/v1/fictionfigure/products/img${n}.png`;

/** In-memory stand-in for the Prisma transaction client (no database is touched). */
function fakeTx(initialImages: string[], variants: { id: string; imageUrl: string | null }[]) {
  const state = {
    images: initialImages.map((u, i) => ({ url: u, sortOrder: i, isPrimary: i === 0, altText: null as string | null })),
    variants: variants.map((v) => ({ ...v })),
  };
  const tx: ImageTx = {
    productImage: {
      findMany: async () => [...state.images].sort((a, b) => a.sortOrder - b.sortOrder),
      deleteMany: async () => {
        state.images = [];
      },
      createMany: async ({ data }: any) => {
        state.images.push(...data);
      },
    },
    productVariant: {
      findMany: async () => state.variants.map((v) => ({ ...v })),
      update: async ({ where, data }: any) => {
        const v = state.variants.find((x) => x.id === where.id)!;
        v.imageUrl = data.imageUrl;
      },
    },
  };
  return { tx, state };
}

test("legacy string[] payload keeps order and makes the first image primary", () => {
  const r = normalizeProductImages([url(1), url(2), url(3)]);
  assert.ok(r.ok);
  const rows = toImageRows(r.images, "Luffy Gear 5");
  assert.deepEqual(rows.map((x) => [x.url, x.sortOrder, x.isPrimary]), [
    [url(1), 0, true],
    [url(2), 1, false],
    [url(3), 2, false],
  ]);
  assert.equal(rows[0].altText, "Luffy Gear 5");
  assert.equal(rows[2].altText, "Luffy Gear 5 — view 3");
});

test("object payload: isPrimary moves the image to the front, alt text kept", () => {
  const r = normalizeProductImages([{ url: url(1) }, { url: url(2), isPrimary: true, altText: "Box contents" }, url(3)]);
  assert.ok(r.ok);
  assert.deepEqual(r.images.map((i) => i.url), [url(2), url(1), url(3)]);
  assert.equal(r.images[0].altText, "Box contents");
});

test("duplicates and empty entries are dropped", () => {
  const r = normalizeProductImages([url(1), "", null, url(1), { url: url(2) }, { url: url(2) }]);
  assert.ok(r.ok);
  assert.deepEqual(r.images.map((i) => i.url), [url(1), url(2)]);
});

test("more than the maximum is rejected", () => {
  const r = normalizeProductImages(Array.from({ length: MAX_PRODUCT_IMAGES + 1 }, (_, i) => url(i)));
  assert.equal(r.ok, false);
});

test("invalid URLs and non-list payloads are rejected", () => {
  assert.equal(normalizeProductImages(["javascript:alert(1)"]).ok, false);
  assert.equal(normalizeProductImages(["ftp://x/y.png"]).ok, false);
  assert.equal(normalizeProductImages("https://x/y.png").ok, false);
  assert.ok(normalizeProductImages(["/uploads/products/prod_1.png"]).ok, "local dev uploads stay valid");
});

test("editing with the same list keeps every existing image (no loss on save)", async () => {
  const existing = [url(1), url(2), url(3), url(4)];
  const { tx, state } = fakeTx(existing, [{ id: "std", imageUrl: url(1) }]);
  const r = normalizeProductImages(existing);
  assert.ok(r.ok);
  await replaceProductImages(tx, "p1", r.images, "Figure");
  assert.deepEqual(state.images.map((i) => i.url), existing);
  assert.equal(state.variants[0].imageUrl, url(1));
});

test("reorder + remove: new order saved, removed image gone", async () => {
  const { tx, state } = fakeTx([url(1), url(2), url(3)], []);
  const r = normalizeProductImages([url(3), url(1)]);
  assert.ok(r.ok);
  await replaceProductImages(tx, "p1", r.images, "Figure");
  assert.deepEqual(state.images.map((i) => [i.url, i.sortOrder, i.isPrimary]), [
    [url(3), 0, true],
    [url(1), 1, false],
  ]);
});

test("changing the primary updates the default variant used by cart and checkout", async () => {
  const { tx, state } = fakeTx([url(1), url(2)], [
    { id: "std", imageUrl: url(1) }, // followed the old cover
    { id: "empty", imageUrl: null }, // had no image
    { id: "custom", imageUrl: "https://res.cloudinary.com/demo/variant-red.png" }, // variant-specific image
    { id: "side", imageUrl: url(2) }, // deliberately pointed at a gallery image that still exists
  ]);
  const r = normalizeProductImages([{ url: url(1) }, { url: url(2), isPrimary: true }]);
  assert.ok(r.ok);
  await replaceProductImages(tx, "p1", r.images, "Figure");
  const byId = Object.fromEntries(state.variants.map((v) => [v.id, v.imageUrl]));
  assert.equal(byId.std, url(2));
  assert.equal(byId.empty, url(2));
  assert.equal(byId.custom, "https://res.cloudinary.com/demo/variant-red.png");
  assert.equal(byId.side, url(2));
});

test("a variant showing a removed gallery image moves to the new cover", async () => {
  const { tx, state } = fakeTx([url(1), url(2), url(3)], [{ id: "v", imageUrl: url(3) }]);
  const r = normalizeProductImages([url(1), url(2)]);
  assert.ok(r.ok);
  await replaceProductImages(tx, "p1", r.images, "Figure");
  assert.equal(state.variants[0].imageUrl, url(1));
});

test("legacy single-image product: saving its one image changes nothing", async () => {
  const { tx, state } = fakeTx([url(9)], [{ id: "std", imageUrl: url(9) }]);
  const r = normalizeProductImages([url(9)]);
  assert.ok(r.ok);
  await replaceProductImages(tx, "p1", r.images, "Figure");
  assert.deepEqual(state.images.map((i) => [i.url, i.isPrimary]), [[url(9), true]]);
  assert.equal(state.variants[0].imageUrl, url(9));
});
