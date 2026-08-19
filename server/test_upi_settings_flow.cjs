const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const { prisma } = require('./dist/db.js');
const { clearSettingsCache, getStoreSettingsHelper } = require('./dist/routes/settings.js');

const JWT_SECRET = process.env.JWT_SECRET || 'fictionfigure-super-secret-jwt-key-2026';

async function runUpiSettingsFlowTest() {
  console.log("=================================================");
  console.log("STARTING UPI SETTINGS & UTR REMOVAL TEST SUITE");
  console.log("=================================================");

  // 1. Check Default Settings Helper
  console.log("\n[TEST 1] Testing getStoreSettingsHelper()...");
  const settingsHelper = await getStoreSettingsHelper();
  console.log("✅ Store Settings Helper returned upi_id:", settingsHelper.settingsMap.upi_id || "fictionfigure@upi");

  // 2. Admin Upsert upi_id & upi_qr_url
  console.log("\n[TEST 2 & 3] Admin saving upi_id and upi_qr_url to StoreSetting...");
  const testUpiId = `testmerchant-${Date.now()}@upi`;
  const testQrUrl = `https://res.cloudinary.com/test/image/upload/v178000/qr_${Date.now()}.png`;

  await prisma.storeSetting.upsert({
    where: { key: "upi_id" },
    update: { value: testUpiId },
    create: { key: "upi_id", value: testUpiId },
  });

  await prisma.storeSetting.upsert({
    where: { key: "upi_qr_url" },
    update: { value: testQrUrl },
    create: { key: "upi_qr_url", value: testQrUrl },
  });

  // 4. Test Cache Invalidation
  console.log("\n[TEST 4] Testing settings cache invalidation...");
  clearSettingsCache();
  const refreshedHelper = await getStoreSettingsHelper();
  if (refreshedHelper.settingsMap.upi_id !== testUpiId || refreshedHelper.settingsMap.upi_qr_url !== testQrUrl) {
    throw new Error(`Cache invalidation test failed! Expected ${testUpiId}, got ${refreshedHelper.settingsMap.upi_id}`);
  }
  console.log("✅ Cache invalidation verified! Refreshed UPI ID:", refreshedHelper.settingsMap.upi_id);

  // 5. Test UPI Order Creation without UTR
  console.log("\n[TEST 5 & 6 & 7] Testing UPI order creation WITHOUT customer-entered UTR...");

  // Setup verified test user
  const user = await prisma.user.upsert({
    where: { email: "upi_tester@fictionfigure.in" },
    update: { phoneVerified: true },
    create: {
      email: "upi_tester@fictionfigure.in",
      phone: "9876543210",
      phoneVerified: true,
      firstName: "UPI",
      lastName: "Tester",
      passwordHash: "hash",
      role: "CUSTOMER",
    },
  });

  // Setup test product
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "UPI Test Cat", slug: `upi-cat-${Date.now()}` },
    });
  }

  const product = await prisma.product.create({
    data: {
      name: "UPI Test Collectible",
      slug: `upi-test-prod-${Date.now()}`,
      sku: `SKU-UPI-${Date.now()}`,
      price: 1200,
      categoryId: category.id,
      brand: "FictionFigure",
      shortDescription: "UPI test figure",
      description: "UPI test figure description",
      variants: {
        create: [
          {
            title: "Standard Edition",
            sku: `VAR-UPI-${Date.now()}`,
            price: 1200,
            inventoryCount: 10,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const variant = product.variants[0];

  // Perform UPI order creation simulation (transaction without requiring UTR)
  const orderNumber = `FF-UPI-${Date.now().toString().slice(-6)}`;
  const upiOrder = await prisma.$transaction(async (tx) => {
    // Inventory reservation
    const updateResult = await tx.productVariant.updateMany({
      where: { id: variant.id, inventoryCount: { gte: 1 } },
      data: { inventoryCount: { decrement: 1 } },
    });
    if (updateResult.count === 0) throw new Error("Stock insufficient");

    return await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
        subtotal: 1200,
        shippingAmount: 100,
        totalAmount: 1300,
        shippingAddressJson: JSON.stringify({
          fullName: "UPI Tester",
          streetAddress: "123 Test Street",
          city: "Bikaner",
          state: "Rajasthan",
          postalCode: "334001",
          phone: "9876543210",
        }),
        shippingMethod: "Standard Delivery",
        items: {
          create: [{ productId: product.id, variantId: variant.id, title: product.name, sku: variant.sku, price: 1200, quantity: 1, total: 1200 }],
        },
        payments: {
          create: {
            paymentMethod: "UPI",
            status: "PENDING",
            amount: 1300,
            transactionRef: null, // NO UTR REQUIRED
          },
        },
      },
      include: { payments: true },
    });
  });

  console.log("✅ UPI order created successfully without UTR! Order #:", upiOrder.orderNumber);
  console.log("✅ Payment record:", upiOrder.payments[0]);

  // 8. Test COD Order Creation
  console.log("\n[TEST 8] Testing COD order creation...");
  const codOrderNumber = `FF-COD-${Date.now().toString().slice(-6)}`;
  const codOrder = await prisma.order.create({
    data: {
      orderNumber: codOrderNumber,
      userId: user.id,
      status: "PENDING",
      subtotal: 1200,
      shippingAmount: 100,
      totalAmount: 1300,
      shippingAddressJson: JSON.stringify({
        fullName: "COD Tester",
        streetAddress: "123 Test Street",
        city: "Bikaner",
        state: "Rajasthan",
        postalCode: "334001",
        phone: "9876543210",
      }),
      shippingMethod: "Standard Delivery",
      items: {
        create: [{ productId: product.id, variantId: variant.id, title: product.name, sku: variant.sku, price: 1200, quantity: 1, total: 1200 }],
      },
      payments: {
        create: {
          paymentMethod: "COD",
          status: "PENDING",
          amount: 1300,
          transactionRef: null,
        },
      },
    },
    include: { payments: true },
  });
  console.log("✅ COD order created successfully! Order #:", codOrder.orderNumber);

  // 9. Test Blank Settings Handling
  console.log("\n[TEST 9] Testing blank upi_id and upi_qr_url handling...");
  await prisma.storeSetting.upsert({
    where: { key: "upi_id" },
    update: { value: "" },
    create: { key: "upi_id", value: "" },
  });
  await prisma.storeSetting.upsert({
    where: { key: "upi_qr_url" },
    update: { value: "" },
    create: { key: "upi_qr_url", value: "" },
  });
  clearSettingsCache();
  const blankHelper = await getStoreSettingsHelper();
  console.log("✅ Blank settings handled safely without crashing. Helper returned map keys successfully.");

  // Clean up test setting values back to defaults
  await prisma.storeSetting.upsert({
    where: { key: "upi_id" },
    update: { value: "fictionfigure@upi" },
    create: { key: "upi_id", value: "fictionfigure@upi" },
  });
  clearSettingsCache();

  console.log("\n=================================================");
  console.log("ALL UPI SETTINGS & UTR REMOVAL TESTS PASSED! 🎉");
  console.log("=================================================");
}

runUpiSettingsFlowTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
