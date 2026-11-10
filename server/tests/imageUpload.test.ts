import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { AddressInfo } from "node:net";
import adminRouter, { imageUploadHandler, PRODUCT_IMAGE_MAX_MB, SITE_IMAGE_MAX_MB } from "../src/routes/admin.js";

// Never touch real Cloudinary from tests: without credentials (and outside production)
// the handler stores files in the local dev uploads folder, which we clean up afterwards.
for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) delete process.env[k];
assert.notEqual(process.env.NODE_ENV, "production");

const MB = 1024 * 1024;
const written: string[] = [];
let base = "";
let server: ReturnType<express.Express["listen"]>;

before(async () => {
  const app = express();
  // Validation behaviour of each route's limit, without the admin guard (auth is tested separately below).
  app.post("/t/product", imageUploadHandler(PRODUCT_IMAGE_MAX_MB));
  app.post("/t/site", imageUploadHandler(SITE_IMAGE_MAX_MB));
  // The real admin router, to prove both upload routes still require an admin token.
  app.use("/api/admin", adminRouter);
  server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  for (const f of written) fs.rmSync(path.join(process.cwd(), "uploads", "products", f), { force: true });
});

async function upload(route: string, bytes: number, name: string, type: string, field = "image") {
  const form = new FormData();
  form.append(field, new Blob([new Uint8Array(bytes)], { type }), name);
  const res = await fetch(base + route, { method: "POST", body: form });
  const body = await res.json();
  if (body.filename) written.push(body.filename);
  return { status: res.status, body };
}

test("homepage hero/slide route accepts a 6 MB PNG (the failing case: >5 MB)", async () => {
  const r = await upload("/t/site", 6 * MB, "hero-background.png", "image/png");
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.success, true);
  assert.match(r.body.url, /\/uploads\/products\/prod_.*\.png$/);
});

test("homepage route still rejects files over 10 MB", async () => {
  const r = await upload("/t/site", 11 * MB, "huge.png", "image/png");
  assert.equal(r.status, 400);
  assert.equal(r.body.error, "File exceeds 10 MB size limit.");
});

test("homepage route still rejects unsupported formats", async () => {
  const r = await upload("/t/site", 1000, "anim.gif", "image/gif");
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Unsupported file type/);
});

test("homepage route rejects a request with no image", async () => {
  const r = await upload("/t/site", 1000, "x.png", "image/png", "wrongField");
  assert.equal(r.status, 400);
});

test("product image route is unchanged: 5 MB limit and same messages", async () => {
  const big = await upload("/t/product", 6 * MB, "figure.png", "image/png");
  assert.equal(big.status, 400);
  assert.equal(big.body.error, "File exceeds 5 MB size limit.");
  const ok = await upload("/t/product", 1 * MB, "figure.webp", "image/webp");
  assert.equal(ok.status, 200);
  const bad = await upload("/t/product", 1000, "x.gif", "image/gif");
  assert.equal(bad.body.error, "Unsupported file type. Only JPG, PNG, and WEBP images up to 5 MB are allowed.");
});

test("both upload routes still require an admin token", async () => {
  for (const route of ["/api/admin/uploads/site-image", "/api/admin/uploads/product-image"]) {
    const r = await upload(route, 1000, "x.png", "image/png");
    assert.equal(r.status, 401, route);
  }
  const res = await fetch(base + "/api/admin/uploads/site-image", {
    method: "POST",
    headers: { Authorization: "Bearer not-a-real-token" },
    body: new FormData(),
  });
  assert.equal(res.status, 401);
});
