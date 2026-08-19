const path = require('path');
require('dotenv').config();

const { prisma } = require('./dist/db.js');

async function runInventoryRaceTest() {
  console.log("=== STARTING INVENTORY CONCURRENCY & RACE CONDITION TEST ===");

  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Race Test Category", slug: `race-test-${Date.now()}` },
    });
  }

  // Create test product with EXACTLY 1 stock unit
  const product = await prisma.product.create({
    data: {
      name: "Limited 1-Unit Statue",
      slug: `limited-statue-${Date.now()}`,
      sku: `SKU-RACE-${Date.now()}`,
      price: 1500,
      categoryId: category.id,
      brand: "Race Test Brand",
      shortDescription: "Statue short description",
      description: "Statue created for race condition test",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-RACE-${Date.now()}`,
            price: 1500,
            inventoryCount: 1, // EXACTLY 1 IN STOCK
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];
  console.log(`[SETUP] Created product ${product.id} with stock = 1 (variant: ${variant.id})`);

  // Create 10 verified test users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const u = await prisma.user.upsert({
      where: { email: `race_user_${i}@fictionfigure.in` },
      update: {},
      create: {
        email: `race_user_${i}@fictionfigure.in`,
        phone: `990000000${i}`,
        phoneVerified: true,
        firstName: `Buyer${i}`,
        lastName: "Test",
        passwordHash: "hash",
        role: "CUSTOMER",
      },
    });
    users.push(u);
  }

  // Helper to place atomic transaction order with strict atomic conditional updateMany
  async function attemptPurchase(user) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Atomic conditional update ensures inventory >= 1 before decrementing
        const updateResult = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            inventoryCount: { gte: 1 },
          },
          data: {
            inventoryCount: { decrement: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Insufficient stock available.");
        }

        const order = await tx.order.create({
          data: {
            orderNumber: `FF-RACE-${user.id.slice(0, 5)}-${Date.now()}`,
            userId: user.id,
            status: "PENDING",
            subtotal: 1500,
            totalAmount: 1500,
            shippingAddressJson: JSON.stringify({ fullName: user.firstName, streetAddress: "Test", city: "Test", state: "Rajasthan", postalCode: "334001" }),
            shippingMethod: "Standard",
            items: {
              create: [{ productId: product.id, variantId: variant.id, title: product.name, sku: variant.sku, price: 1500, quantity: 1, total: 1500 }],
            },
          },
        });
        return { success: true, orderId: order.id };
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  console.log("Simulating 10 SIMULTANEOUS buyers attempting to purchase stock=1 with atomic updateMany...");
  const results = await Promise.all(users.map((u) => attemptPurchase(u)));

  const successfulCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  const finalVariant = await prisma.productVariant.findUnique({ where: { id: variant.id } });

  console.log("\n=== RACE TEST RESULTS ===");
  console.log(`Successful orders placed: ${successfulCount}`);
  console.log(`Failed / Rejected orders: ${failedCount}`);
  console.log(`Final remaining stock: ${finalVariant.inventoryCount}`);

  if (successfulCount !== 1) {
    throw new Error(`CRITICAL INVENTORY RACE FAILURE: Expected 1 successful order, but got ${successfulCount}!`);
  }
  if (finalVariant.inventoryCount < 0) {
    throw new Error(`CRITICAL INVENTORY RACE FAILURE: Negative stock detected (${finalVariant.inventoryCount})!`);
  }

  console.log("✅ ATOMIC INVENTORY RACE CONDITION TEST PASSED PERFECTLY! (0 oversells, 0 negative stock)\n");
}

runInventoryRaceTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
