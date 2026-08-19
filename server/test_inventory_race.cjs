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

  // TEST CASE 1: stock = 1, 10 buyers
  const product1 = await prisma.product.create({
    data: {
      name: "Limited 1-Unit Statue",
      slug: `limited-statue-1-${Date.now()}`,
      sku: `SKU-RACE-1-${Date.now()}`,
      price: 1500,
      categoryId: category.id,
      brand: "Race Test Brand",
      shortDescription: "Statue short description",
      description: "Statue created for race condition test",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-RACE-1-${Date.now()}`,
            price: 1500,
            inventoryCount: 1, // EXACTLY 1 IN STOCK
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant1 = product1.variants[0];
  console.log(`[SETUP 1] Created product ${product1.id} with stock = 1 (variant: ${variant1.id})`);

  // Create 20 verified test users
  const users = [];
  for (let i = 0; i < 20; i++) {
    const u = await prisma.user.upsert({
      where: { email: `race_user_${i}@fictionfigure.in` },
      update: {},
      create: {
        email: `race_user_${i}@fictionfigure.in`,
        phone: `99000000${i < 10 ? '0' + i : i}`,
        phoneVerified: true,
        firstName: `Buyer${i}`,
        lastName: "Test",
        passwordHash: "hash",
        role: "CUSTOMER",
      },
    });
    users.push(u);
  }

  async function attemptPurchase(user, targetVariant) {
    try {
      return await prisma.$transaction(async (tx) => {
        const updateResult = await tx.productVariant.updateMany({
          where: {
            id: targetVariant.id,
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
            orderNumber: `FF-RACE-${user.id.slice(0, 5)}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            userId: user.id,
            status: "PENDING",
            subtotal: 1500,
            totalAmount: 1500,
            shippingAddressJson: JSON.stringify({ fullName: user.firstName, streetAddress: "Test", city: "Test", state: "Rajasthan", postalCode: "334001" }),
            shippingMethod: "Standard",
            items: {
              create: [{ productId: targetVariant.productId, variantId: targetVariant.id, title: "Test Item", sku: targetVariant.sku, price: 1500, quantity: 1, total: 1500 }],
            },
          },
        });
        return { success: true, orderId: order.id };
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  console.log("Simulating 10 SIMULTANEOUS buyers attempting to purchase stock=1...");
  const results1 = await Promise.all(users.slice(0, 10).map((u) => attemptPurchase(u, variant1)));

  const successfulCount1 = results1.filter((r) => r.success).length;
  const failedCount1 = results1.filter((r) => !r.success).length;
  const finalVariant1 = await prisma.productVariant.findUnique({ where: { id: variant1.id } });

  console.log("\n=== RACE TEST 1 RESULTS (Stock = 1, Buyers = 10) ===");
  console.log(`Successful orders: ${successfulCount1}`);
  console.log(`Rejected orders: ${failedCount1}`);
  console.log(`Final stock: ${finalVariant1.inventoryCount}`);

  if (successfulCount1 !== 1 || finalVariant1.inventoryCount < 0) {
    throw new Error(`RACE TEST 1 FAILED! Successful: ${successfulCount1}, Stock: ${finalVariant1.inventoryCount}`);
  }

  // TEST CASE 2: stock = 5, 20 buyers
  const product2 = await prisma.product.create({
    data: {
      name: "Limited 5-Unit Statue",
      slug: `limited-statue-5-${Date.now()}`,
      sku: `SKU-RACE-5-${Date.now()}`,
      price: 1500,
      categoryId: category.id,
      brand: "Race Test Brand",
      shortDescription: "Statue short description",
      description: "Statue created for race condition test",
      variants: {
        create: [
          {
            title: "Limited Edition",
            sku: `VAR-RACE-5-${Date.now()}`,
            price: 1500,
            inventoryCount: 5, // EXACTLY 5 IN STOCK
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant2 = product2.variants[0];
  console.log(`\n[SETUP 2] Created product ${product2.id} with stock = 5 (variant: ${variant2.id})`);

  console.log("Simulating 20 SIMULTANEOUS buyers attempting to purchase stock=5...");
  const results2 = await Promise.all(users.map((u) => attemptPurchase(u, variant2)));

  const successfulCount2 = results2.filter((r) => r.success).length;
  const failedCount2 = results2.filter((r) => !r.success).length;
  const finalVariant2 = await prisma.productVariant.findUnique({ where: { id: variant2.id } });

  console.log("\n=== RACE TEST 2 RESULTS (Stock = 5, Buyers = 20) ===");
  console.log(`Successful orders: ${successfulCount2}`);
  console.log(`Rejected orders: ${failedCount2}`);
  console.log(`Final stock: ${finalVariant2.inventoryCount}`);

  if (successfulCount2 !== 5 || finalVariant2.inventoryCount < 0) {
    throw new Error(`RACE TEST 2 FAILED! Successful: ${successfulCount2}, Stock: ${finalVariant2.inventoryCount}`);
  }

  console.log("\n✅ ALL ATOMIC INVENTORY RACE CONDITION TESTS PASSED PERFECTLY! (0 oversells, 0 negative stock)\n");
}

runInventoryRaceTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
