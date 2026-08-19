const path = require('path');
require('dotenv').config();

const { prisma } = require('./dist/db.js');
const { handleValidateCart } = require('./dist/routes/checkout.js');

async function runCartReconciliationTestSuite() {
  console.log("=================================================");
  console.log("STARTING STALE CART & RECONCILIATION TEST SUITE");
  console.log("=================================================");

  // Setup Category & Product
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Cart Reconciliation Test Cat", slug: `cart-cat-${Date.now()}` },
    });
  }

  // Create Product 1 (Active, Stock 2, Price 500)
  const prod1 = await prisma.product.create({
    data: {
      name: "Reconciliation Test Figure A",
      slug: `recon-fig-a-${Date.now()}`,
      sku: `SKU-RECON-A-${Date.now()}`,
      price: 500,
      categoryId: category.id,
      brand: "FictionFigure",
      shortDescription: "Recon test product A",
      description: "Recon test product description A",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-RECON-A-${Date.now()}`,
            price: 500,
            inventoryCount: 2,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Create Product 2 (Active, Stock 0 - Out of stock)
  const prod2 = await prisma.product.create({
    data: {
      name: "Reconciliation Test Figure B (OOS)",
      slug: `recon-fig-b-${Date.now()}`,
      sku: `SKU-RECON-B-${Date.now()}`,
      price: 1200,
      categoryId: category.id,
      brand: "FictionFigure",
      shortDescription: "Recon test product B",
      description: "Recon test product description B",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-RECON-B-${Date.now()}`,
            price: 1200,
            inventoryCount: 0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant1 = prod1.variants[0];
  const variant2 = prod2.variants[0];
  const nonExistentVariantId = `non-existent-variant-${Date.now()}`;

  // Helper function to invoke handleValidateCart logic locally
  async function runValidation(itemsPayload) {
    let responseData = null;
    const req = { body: { items: itemsPayload } };
    const res = {
      json: (data) => { responseData = data; return data; },
      status: (code) => res,
    };
    await handleValidateCart(req, res);
    return responseData;
  }

  // 1. TEST DELETED PRODUCT AUTO-REMOVAL
  console.log("\n[TEST 1] Testing DELETED PRODUCT AUTO-REMOVAL...");
  const test1Res = await runValidation([{ variantId: nonExistentVariantId, quantity: 1, price: 500 }]);
  console.log("Response valid:", test1Res.valid);
  console.log("Removed items:", test1Res.removedItems);

  if (test1Res.valid || test1Res.items.length !== 0 || test1Res.removedItems.length !== 1) {
    throw new Error("DELETED PRODUCT AUTO-REMOVAL FAILED!");
  }
  console.log("✅ DELETED PRODUCT AUTO-REMOVAL PASSED!");

  // 2. TEST OUT-OF-STOCK AUTO-REMOVAL
  console.log("\n[TEST 2] Testing OUT-OF-STOCK AUTO-REMOVAL...");
  const test2Res = await runValidation([{ variantId: variant2.id, quantity: 1, price: 1200 }]);
  console.log("Response valid:", test2Res.valid);
  console.log("Removed items:", test2Res.removedItems);

  if (test2Res.valid || test2Res.items.length !== 0 || test2Res.removedItems.length !== 1) {
    throw new Error("OUT-OF-STOCK AUTO-REMOVAL FAILED!");
  }
  console.log("✅ OUT-OF-STOCK AUTO-REMOVAL PASSED!");

  // 3. TEST QUANTITY CLAMPING
  console.log("\n[TEST 3] Testing QUANTITY CLAMPING (Cart requested 5, DB Stock 2)...");
  const test3Res = await runValidation([{ variantId: variant1.id, quantity: 5, price: 500 }]);
  console.log("Validated items:", test3Res.items);
  console.log("Updated items:", test3Res.updatedItems);

  if (test3Res.items.length !== 1 || test3Res.items[0].quantity !== 2) {
    throw new Error(`QUANTITY CLAMPING FAILED! Expected quantity 2, got ${test3Res.items[0]?.quantity}`);
  }
  console.log("✅ QUANTITY CLAMPING PASSED!");

  // 4. TEST PRICE AUTO-UPDATE
  console.log("\n[TEST 4] Testing PRICE AUTO-UPDATE (Stale cart price 200 vs DB price 500)...");
  const test4Res = await runValidation([{ variantId: variant1.id, quantity: 1, price: 200 }]);
  console.log("Validated item price:", test4Res.items[0].price);
  console.log("Updated items entry:", test4Res.updatedItems);

  if (test4Res.items[0].price !== 500) {
    throw new Error(`PRICE AUTO-UPDATE FAILED! Expected price 500, got ${test4Res.items[0].price}`);
  }
  console.log("✅ PRICE AUTO-UPDATE PASSED!");

  // 5. TEST MIXED RECONCILIATION
  console.log("\n[TEST 5] Testing MIXED CART (1 Valid + 1 Deleted + 1 OOS)...");
  const test5Res = await runValidation([
    { variantId: variant1.id, quantity: 1, price: 500 },
    { variantId: variant2.id, quantity: 1, price: 1200 },
    { variantId: nonExistentVariantId, quantity: 1, price: 999 },
  ]);
  console.log("Valid items remaining count:", test5Res.items.length);
  console.log("Removed items count:", test5Res.removedItems.length);

  if (test5Res.items.length !== 1 || test5Res.removedItems.length !== 2) {
    throw new Error("MIXED CART RECONCILIATION FAILED!");
  }
  console.log("✅ MIXED CART RECONCILIATION PASSED!");

  // 6. TEST CHECKOUT REJECTION FOR DELETED PRODUCT
  console.log("\n[TEST 6] Testing CHECKOUT REJECTION for DELETED PRODUCT...");
  const { calculateAuthoritativeTotals } = require('./dist/routes/checkout.js');
  let checkoutError = null;
  try {
    await calculateAuthoritativeTotals([{ variantId: nonExistentVariantId, quantity: 1 }]);
  } catch (err) {
    checkoutError = err.message;
  }
  console.log("Checkout calculation error message:", checkoutError);
  if (!checkoutError) {
    throw new Error("CHECKOUT REJECTION FAILED! Checkout allowed deleted product.");
  }
  console.log("✅ CHECKOUT REJECTION PASSED!");

  console.log("\n=================================================");
  console.log("ALL CART RECONCILIATION TESTS PASSED PERFECTLY! 🎉");
  console.log("=================================================");
}

runCartReconciliationTestSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
