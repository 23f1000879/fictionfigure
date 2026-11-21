import { test } from "node:test";
import assert from "node:assert/strict";
import { tinyImageUrl } from "../src/lib/tinyImageUrl.ts";

test("decorative local photos request a tiny rendition, not the original", () => {
  assert.equal(tinyImageUrl("/campaign/fandom-podium.webp", 64, 35), "/_next/image?url=%2Fcampaign%2Ffandom-podium.webp&w=64&q=35");
});
test("Cloudinary output stays small even when the source already has a large transformation", () => {
  const result = tinyImageUrl("https://res.cloudinary.com/demo/image/upload/w_1600,c_fill/v123/photo.webp", 32);
  assert.equal(result, "https://res.cloudinary.com/demo/image/upload/w_1600,c_fill/c_limit,w_32,q_25,f_auto/v123/photo.webp");
});
test("versioned Cloudinary originals use the CDN's tiny delivery", () => {
  assert.equal(tinyImageUrl("https://res.cloudinary.com/demo/image/upload/v123/photo.webp", 64, 35), "https://res.cloudinary.com/demo/image/upload/c_limit,w_64,q_35,f_auto/v123/photo.webp");
});
test("unversioned remote photos use the existing optimizer without guessing public IDs", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/folder/photo.jpg";
  assert.equal(tinyImageUrl(url, 32), `/_next/image?url=${encodeURIComponent(url)}&w=32&q=25`);
});
test("an already optimized image is resized without nesting optimizer URLs", () => {
  const result = tinyImageUrl("/_next/image?url=%2Fphoto.jpg&w=1200&q=75", 32);
  assert.equal(result, "/_next/image?url=%2Fphoto.jpg&w=32&q=25");
});
test("SVGs and temporary local previews keep their original delivery", () => {
  for (const src of ["/logo.svg", "data:image/png;base64,abc", "blob:https://example.com/preview"]) assert.equal(tinyImageUrl(src, 32), src);
});
