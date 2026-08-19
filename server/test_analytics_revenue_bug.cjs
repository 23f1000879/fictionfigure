const path = require('path');
require('dotenv').config();

const { prisma } = require('./dist/db.js');
const { isRevenueEligibleOrder, REVENUE_ELIGIBLE_ORDER_WHERE } = require('./dist/routes/admin.js');

async function runAnalyticsRevenueBugTest() {
  console.log("=================================================");
  console.log("STARTING ANALYTICS REVENUE BUG AUTOMATED TEST");
  console.log("=================================================");

  // Setup test category & product
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Analytics Test Cat", slug: `analytics-cat-${Date.now()}` },
    });
  }

  const product = await prisma.product.create({
    data: {
      name: "Analytics Test Figurine",
      slug: `analytics-test-fig-${Date.now()}`,
      sku: `SKU-ANAL-TEST-${Date.now()}`,
      price: 500,
      categoryId: category.id,
      brand: "FictionFigure",
      shortDescription: "Analytics test product",
      description: "Analytics test product description",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-ANAL-TEST-${Date.now()}`,
            price: 500,
            inventoryCount: 20,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];

  // Helper to cleanup created test orders
  const createdOrderIds = [];

  try {
    // 1. Create a CANCELLED order worth ₹299
    const cancelledOrder = await prisma.order.create({
      data: {
        orderNumber: `FF-CANCELLED-${Date.now()}`,
        status: "CANCELLED",
        subtotal: 299,
        shippingAmount: 0,
        totalAmount: 299,
        shippingAddressJson: JSON.stringify({ fullName: "Cancelled User" }),
        shippingMethod: "Standard",
        items: {
          create: [{ productId: product.id, variantId: variant.id, title: product.name, sku: variant.sku, price: 299, quantity: 1, total: 299 }],
        },
      },
    });
    createdOrderIds.push(cancelledOrder.id);

    console.log("\n[TEST 1] Created CANCELLED order #", cancelledOrder.orderNumber, "for ₹299");

    // Test stats calculation with ONLY CANCELLED order
    const statsCancelledOnly = await prisma.order.aggregate({
      where: REVENUE_ELIGIBLE_ORDER_WHERE,
      _sum: { totalAmount: true },
    });
    const rev1 = statsCancelledOnly._sum.totalAmount || 0;
    console.log("Calculated Revenue for CANCELLED order alone:", rev1);
    if (rev1 !== 0) {
      throw new Error(`TEST 1 FAILED! Cancelled order contributed ₹${rev1} to revenue instead of ₹0.`);
    }
    console.log("✅ TEST 1 PASSED! Cancelled order revenue contribution is ₹0.");

    // 2. Create a VALID (DELIVERED) order worth ₹500
    const validOrder = await prisma.order.create({
      data: {
        orderNumber: `FF-VALID-${Date.now()}`,
        status: "DELIVERED",
        subtotal: 500,
        shippingAmount: 0,
        totalAmount: 500,
        shippingAddressJson: JSON.stringify({ fullName: "Valid User" }),
        shippingMethod: "Standard",
        items: {
          create: [{ productId: product.id, variantId: variant.id, title: product.name, sku: variant.sku, price: 500, quantity: 1, total: 500 }],
        },
      },
    });
    createdOrderIds.push(validOrder.id);

    console.log("\n[TEST 2 & 3] Created VALID order #", validOrder.orderNumber, "for ₹500");

    // Query analytics aggregation with BOTH orders in DB
    const allOrders = await prisma.order.findMany({
      where: { id: { in: createdOrderIds } },
      include: { items: { include: { variant: { include: { product: { include: { category: true } } } } } } },
    });

    const validOrdersOnly = allOrders.filter((o) => isRevenueEligibleOrder(o.status));
    const totalRevCalculated = validOrdersOnly.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrdersCalculated = validOrdersOnly.length;
    const aovCalculated = totalOrdersCalculated > 0 ? Math.round(totalRevCalculated / totalOrdersCalculated) : 0;

    console.log("Combined DB Revenue (CANCELLED ₹299 + VALID ₹500):", totalRevCalculated);
    console.log("Combined Valid Orders Count:", totalOrdersCalculated);
    console.log("Calculated Average Order Value (AOV):", aovCalculated);

    if (totalRevCalculated !== 500) {
      throw new Error(`TEST 3 FAILED! Total revenue is ₹${totalRevCalculated} instead of ₹500.`);
    }
    console.log("✅ TEST 2 & 3 PASSED! Total revenue correctly equals ₹500 (CANCELLED ₹299 excluded).");

    // 4. TEST PRODUCTS SOLD & TOP SELLING PRODUCTS
    console.log("\n[TEST 4] Testing Products Sold & Top Selling Products exclusion...");
    const productsSold = validOrdersOnly.reduce(
      (sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    console.log("Products Sold Units:", productsSold);
    if (productsSold !== 1) {
      throw new Error(`TEST 4 FAILED! Products sold count is ${productsSold} instead of 1.`);
    }
    console.log("✅ TEST 4 PASSED! Cancelled order item quantity excluded from sales & top products.");

    // 5. TEST AVERAGE ORDER VALUE
    console.log("\n[TEST 5] Testing Average Order Value (AOV)...");
    if (aovCalculated !== 500) {
      throw new Error(`TEST 5 FAILED! AOV is ₹${aovCalculated} instead of ₹500.`);
    }
    console.log("✅ TEST 5 PASSED! AOV is ₹500 (calculated strictly from revenue-eligible orders).");

  } finally {
    // Clean up created test orders & product
    console.log("\n[CLEANUP] Removing test orders & product...");
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
    console.log("✅ Test data cleaned up successfully.");
  }

  console.log("\n=================================================");
  console.log("ALL ANALYTICS REVENUE TESTS PASSED PERFECTLY! 🎉");
  console.log("=================================================");
}

runAnalyticsRevenueBugTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
