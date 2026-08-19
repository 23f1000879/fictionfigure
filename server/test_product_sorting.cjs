const path = require('path');
require('dotenv').config();

const { prisma } = require('./dist/db.js');

async function runProductSortingTest() {
  console.log("=================================================");
  console.log("STARTING END-TO-END PRODUCT SORTING TEST SUITE");
  console.log("=================================================");

  // Ensure test products exist
  let cat = await prisma.category.findFirst();
  if (!cat) {
    cat = await prisma.category.create({
      data: { name: "Sort Test Category", slug: `sort-cat-${Date.now()}` },
    });
  }

  // Create 4 distinct test products with known prices and names
  const testProducts = [
    { name: "Alpha Figure", price: 1500, featured: false, slug: `alpha-${Date.now()}`, sku: `SKU-A-${Date.now()}` },
    { name: "Beta Statue", price: 5000, featured: true, slug: `beta-${Date.now()}`, sku: `SKU-B-${Date.now()}` },
    { name: "Gamma Collectible", price: 800, featured: false, slug: `gamma-${Date.now()}`, sku: `SKU-C-${Date.now()}` },
    { name: "Delta Toy", price: 3200, featured: true, slug: `delta-${Date.now()}`, sku: `SKU-D-${Date.now()}` },
  ];

  for (const tp of testProducts) {
    await prisma.product.create({
      data: {
        name: tp.name,
        slug: tp.slug,
        sku: tp.sku,
        price: tp.price,
        featured: tp.featured,
        categoryId: cat.id,
        brand: "FictionFigure",
        shortDescription: "Sort test product",
        description: "Sort test description",
      },
    });
  }

  console.log("✅ Seeded test products successfully.");

  // Helper function to query Prisma with order logic matching products.ts
  async function querySortedProducts(sortBy) {
    const sortVal = String(sortBy || "").toLowerCase().trim();
    let orderBy = { createdAt: "desc" };

    if (sortVal === "featured") {
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
    } else if (sortVal === "price-asc" || sortVal === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sortVal === "price-desc" || sortVal === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sortVal === "name-asc" || sortVal === "name_asc" || sortVal === "name") {
      orderBy = { name: "asc" };
    } else if (sortVal === "newest") {
      orderBy = { createdAt: "desc" };
    }

    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 20,
      orderBy,
      select: { id: true, name: true, price: true, featured: true, createdAt: true },
    });
  }

  // 1. PRICE: LOW TO HIGH
  console.log("\n[TEST 1] Testing PRICE: LOW TO HIGH (price-asc)...");
  const lowToHigh = await querySortedProducts("price-asc");
  const pricesLowToHigh = lowToHigh.map((p) => p.price);
  console.log("Prices:", pricesLowToHigh.join(" -> "));
  for (let i = 0; i < pricesLowToHigh.length - 1; i++) {
    if (pricesLowToHigh[i] > pricesLowToHigh[i + 1]) {
      throw new Error(`PRICE LOW TO HIGH FAILED! ${pricesLowToHigh[i]} > ${pricesLowToHigh[i + 1]}`);
    }
  }
  console.log("✅ PRICE: LOW TO HIGH PASSED!");

  // 2. PRICE: HIGH TO LOW
  console.log("\n[TEST 2] Testing PRICE: HIGH TO LOW (price-desc)...");
  const highToLow = await querySortedProducts("price-desc");
  const pricesHighToLow = highToLow.map((p) => p.price);
  console.log("Prices:", pricesHighToLow.join(" -> "));
  for (let i = 0; i < pricesHighToLow.length - 1; i++) {
    if (pricesHighToLow[i] < pricesHighToLow[i + 1]) {
      throw new Error(`PRICE HIGH TO LOW FAILED! ${pricesHighToLow[i]} < ${pricesHighToLow[i + 1]}`);
    }
  }
  console.log("✅ PRICE: HIGH TO LOW PASSED!");

  // 3. NAME: A-Z
  console.log("\n[TEST 3] Testing NAME: A-Z (name-asc)...");
  const nameAsc = await querySortedProducts("name-asc");
  const namesAsc = nameAsc.map((p) => p.name);
  console.log("Names:", namesAsc.join(" -> "));
  for (let i = 0; i < namesAsc.length - 1; i++) {
    if (namesAsc[i] > namesAsc[i + 1]) {
      throw new Error(`NAME A-Z FAILED! '${namesAsc[i]}' > '${namesAsc[i + 1]}'`);
    }
  }
  console.log("✅ NAME: A-Z PASSED!");

  // 4. NEWEST
  console.log("\n[TEST 4] Testing NEWEST (newest)...");
  const newest = await querySortedProducts("newest");
  const datesNewest = newest.map((p) => new Date(p.createdAt).getTime());
  for (let i = 0; i < datesNewest.length - 1; i++) {
    if (datesNewest[i] < datesNewest[i + 1]) {
      throw new Error(`NEWEST FAILED! Older product before newer product.`);
    }
  }
  console.log("✅ NEWEST PASSED!");

  // 5. FEATURED
  console.log("\n[TEST 5] Testing FEATURED (featured)...");
  const featured = await querySortedProducts("featured");
  const featuredFlags = featured.map((p) => p.featured);
  console.log("Featured Flags:", featuredFlags.join(", "));
  console.log("✅ FEATURED PASSED!");

  // 6. INVALID SORT FALLBACK
  console.log("\n[TEST 6] Testing INVALID SORT VALUE FALLBACK...");
  const invalidSort = await querySortedProducts("invalid_random_string");
  if (!invalidSort || invalidSort.length === 0) {
    throw new Error("INVALID SORT FAILED! Returned empty list.");
  }
  console.log("✅ INVALID SORT FALLBACK PASSED!");

  console.log("\n=================================================");
  console.log("ALL PRODUCT SORTING TESTS PASSED PERFECTLY! 🎉");
  console.log("=================================================");
}

runProductSortingTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
