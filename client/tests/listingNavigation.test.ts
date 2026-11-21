import { test } from "node:test";
import assert from "node:assert/strict";
import { buildListingUrl } from "../src/lib/listingNavigation.ts";

test("shop category selection can change again while preserving price and sort", () => {
  const url = new URL(buildListingUrl("/shop", "category=demon-slayer&maxPrice=499&sortBy=price-asc&page=3", { category: "one-piece" }), "https://example.test");
  assert.equal(url.pathname, "/shop");
  assert.equal(url.searchParams.get("category"), "one-piece");
  assert.equal(url.searchParams.get("maxPrice"), "499");
  assert.equal(url.searchParams.get("sortBy"), "price-asc");
  assert.equal(url.searchParams.get("page"), "1");
});
test("All removes the shop category rather than keeping it selected", () => {
  assert.equal(buildListingUrl("/shop", "category=demon-slayer", { category: null }), "/shop?page=1");
});
test("switching categories on a collection page changes its path", () => {
  assert.equal(buildListingUrl("/collections/demon-slayer", "maxPrice=499&page=4", { category: "one-piece" }), "/collections/one-piece?maxPrice=499&page=1");
});
test("All escapes a collection page while preserving other selected filters", () => {
  assert.equal(buildListingUrl("/collections/demon-slayer", "inStockOnly=true", { category: null }), "/shop?inStockOnly=true&page=1");
});
test("price filtering stays within the selected collection", () => {
  assert.equal(buildListingUrl("/collections/demon-slayer", "page=3", { maxPrice: "299" }), "/collections/demon-slayer?page=1&maxPrice=299");
});
test("pagination preserves the category and requested page", () => {
  assert.equal(buildListingUrl("/shop", "category=one-piece&page=1", { page: "2" }), "/shop?category=one-piece&page=2");
});
