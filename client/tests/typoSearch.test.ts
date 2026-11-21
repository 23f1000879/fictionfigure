import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesCatalogQuery, expandCatalogSearch } from "../src/lib/typoSearch.ts";

const catalog = [
  { id: "1", name: "Nezuko Kamado PVC Figure", category: { name: "Demon Slayer" } },
  { id: "2", name: "Naruto Uzumaki Figure", brand: "Banpresto" },
  { id: "3", name: "Gojo Satoru Keychain", franchise: "Jujutsu Kaisen" },
  { id: "4", name: "Luffy Figure", franchise: "One Piece" },
  { id: "5", name: "Doraemon Collectible" },
];

test("corrects single-letter substitutions across unrelated catalog names", () => {
  for (const [query, id] of [["nexuko", "1"], ["narutp", "2"], ["gojo", "3"], ["lufgy", "4"]]) {
    assert.deepEqual(catalog.filter(product => matchesCatalogQuery(product, query)).map(product => product.id), [id]);
  }
});
test("handles missing, extra, and adjacent swapped letters", () => {
  for (const [query, id] of [["nezko", "1"], ["narutoo", "2"], ["naurto", "2"], ["doremon", "5"], ["gjo", "3"]]) {
    assert.ok(matchesCatalogQuery(catalog.find(product => product.id === id)!, query), query);
  }
});
test("matches series and brand spellings without character-specific dictionaries", () => {
  assert.ok(matchesCatalogQuery(catalog[0], "demon slayre"));
  assert.ok(matchesCatalogQuery(catalog[1], "banpresto"));
  assert.ok(matchesCatalogQuery(catalog[2], "jujutsu kaisen"));
});
test("tolerates accents, case, punctuation, spacing, and word order", () => {
  assert.ok(matchesCatalogQuery(catalog[0], "  NÉZUKO!!! "));
  assert.ok(matchesCatalogQuery(catalog[3], "onepiece"));
  assert.ok(matchesCatalogQuery(catalog[3], "onepeice"));
  assert.ok(matchesCatalogQuery(catalog[2], "key-chain"));
  assert.ok(matchesCatalogQuery(catalog[0], "figure for nexuko"));
});
test("automatically supports newly added catalog names", () => {
  assert.ok(matchesCatalogQuery({ id: "new", name: "Velorian Crystal Collectible" }, "velroian"));
});
test("does not invent results for unrelated words, tiny inputs, or mismatched multiword queries", () => {
  for (const query of ["spaceship", "zz", "the", "naruto nezuko", "x".repeat(121)]) {
    assert.equal(catalog.some(product => matchesCatalogQuery(product, query)), false, query);
  }
  assert.equal(matchesCatalogQuery({ id: "sku", name: "Collectible", sku: "FF-1234" }, "FF-1235"), false);
});
test("searches later catalog pages and preserves API sort order and result counts", async () => {
  const pages = [catalog.slice(0,2), catalog.slice(2)];
  const result = await expandCatalogSearch("figuer", async page => ({ products: pages[page-1], totalCount: 5, totalPages: 2 }), 2, 2);
  assert.deepEqual(result?.products.map(product => product.id), ["4"]);
  assert.equal(result?.totalCount, 3);
  assert.equal(result?.totalPages, 2);
  assert.equal(result?.currentPage, 2);
});
test("never turns an incomplete or failed catalog read into partial search results", async () => {
  assert.equal(await expandCatalogSearch("nexuko", async () => ({ products: [catalog[0]], totalCount: 5, totalPages: 1 })), null);
  assert.equal(await expandCatalogSearch("nexuko", async () => { throw new Error("Offline"); }), null);
});
test("ignores empty input without reading the catalog and clamps invalid pages", async () => {
  let reads = 0;
  const read = async () => { reads++; return { products: catalog, totalCount: catalog.length, totalPages: 1 }; };
  assert.equal(await expandCatalogSearch("", read), null);
  assert.equal(reads, 0);
  const result = await expandCatalogSearch("nexuko", read, 99);
  assert.equal(result?.currentPage, 1);
  assert.equal(result?.totalCount, 1);
});
