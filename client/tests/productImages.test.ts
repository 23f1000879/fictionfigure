import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PRODUCT_IMAGES,
  addImageUrls,
  galleryIndexForVariant,
  makePrimary,
  moveImage,
  planUploads,
  primaryImageUrl,
  removeImageAt,
  replaceImageAt,
  validateImageFile,
  wrapIndex,
} from "../src/lib/productImages.ts";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

test("validates type and size", () => {
  assert.equal(validateImageFile(file("a.jpg", "image/jpeg")), null);
  assert.equal(validateImageFile(file("a.webp", "image/webp")), null);
  assert.equal(validateImageFile(file("paste.png", "")), null, "extension fallback for clipboard blobs");
  assert.match(validateImageFile(file("a.gif", "image/gif"))!, /JPG, PNG or WEBP/);
  assert.match(validateImageFile(file("a.pdf", "application/pdf"))!, /JPG, PNG or WEBP/);
  assert.match(validateImageFile(file("big.png", "image/png", 6 * 1024 * 1024))!, /5 MB/);
});

test("multi-select respects the remaining slots and reports rejects", () => {
  const picked = [file("1.png", "image/png"), file("x.gif", "image/gif"), file("2.png", "image/png"), file("3.png", "image/png")];
  const { accepted, errors } = planUploads(picked, 2);
  assert.deepEqual(accepted.map((f) => f.name), ["1.png", "2.png"]);
  assert.equal(errors.length, 2);
  assert.match(errors[1], new RegExp(`at most ${MAX_PRODUCT_IMAGES}`));
});

test("adding skips duplicates and stops at the maximum", () => {
  const list = addImageUrls(["a"], ["b", "a", "c"]);
  assert.deepEqual(list, ["a", "b", "c"]);
  const full = addImageUrls([], Array.from({ length: 12 }, (_, i) => `u${i}`));
  assert.equal(full.length, MAX_PRODUCT_IMAGES);
});

test("remove, reorder and change primary", () => {
  const list = ["front", "side", "back", "box"];
  assert.deepEqual(removeImageAt(list, 1), ["front", "back", "box"]);
  assert.deepEqual(moveImage(list, 3, 1), ["front", "box", "side", "back"]);
  assert.deepEqual(moveImage(list, 0, 9), list, "out-of-range move is ignored");
  assert.deepEqual(makePrimary(list, 2), ["back", "front", "side", "box"]);
  assert.deepEqual(list, ["front", "side", "back", "box"], "operations never mutate the input");
});

test("replace keeps position; replacing with an existing URL drops the slot", () => {
  assert.deepEqual(replaceImageAt(["a", "b", "c"], 1, "z"), ["a", "z", "c"]);
  assert.deepEqual(replaceImageAt(["a", "b", "c"], 1, "c"), ["a", "c"]);
});

test("legacy single-image product: primary is that image", () => {
  assert.equal(primaryImageUrl([{ url: "only.png" }]), "only.png");
  assert.equal(primaryImageUrl([], null), "");
});

test("cart/checkout image prefers the variant image, else the cover — never the browsed thumbnail", () => {
  const images = [{ url: "cover" }, { url: "side" }];
  assert.equal(primaryImageUrl(images, null), "cover");
  assert.equal(primaryImageUrl(images, "variant-red"), "variant-red");
});

test("gallery selection follows the variant image when it is in the gallery", () => {
  const images = [{ url: "cover" }, { url: "side" }, { url: "red" }];
  assert.equal(galleryIndexForVariant(images, "cover"), 0);
  assert.equal(galleryIndexForVariant(images, "red"), 2);
  assert.equal(galleryIndexForVariant(images, "elsewhere"), -1);
  assert.equal(galleryIndexForVariant(images, null), 0);
});

test("prev/next wrap around", () => {
  assert.equal(wrapIndex(-1, 4), 3);
  assert.equal(wrapIndex(4, 4), 0);
  assert.equal(wrapIndex(2, 0), 0);
});
