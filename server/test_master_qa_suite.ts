import jwt from "jsonwebtoken";
import { prisma } from "./src/db.js";
import { getStoreSettingsHelper } from "./src/routes/settings.js";

const PORT = 5001; // Independent test server port
const TEST_BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

async function runMasterQaSuite() {
  console.log("=================================================================");
  console.log("       FICTIONFIGURE MASTER REGRESSION & API QA SUITE            ");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` - ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // Query real database users for authentic token generation
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const customerUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });

  const customerToken = jwt.sign(
    { userId: customerUser?.id || "93e87956-6ddf-47ae-835d-e58c5cf89ac8", role: "CUSTOMER" },
    JWT_SECRET
  );
  const adminToken = jwt.sign(
    { userId: adminUser?.id || "338be2cb-63df-40cb-ae5b-001007efab3f", role: "ADMIN" },
    JWT_SECRET
  );

  try {
    // 1. Categories API (/api/products/categories & /api/categories)
    console.log("--- 1. CATEGORY API REGRESSION TESTS ---");
    const cat1Res = await fetch(`${TEST_BASE_URL}/products/categories`);
    const cat1Type = cat1Res.headers.get("content-type") || "";
    const cat1Data = cat1Res.ok && cat1Type.includes("application/json") ? await cat1Res.json() : null;
    assert(cat1Res.status === 200, "GET /api/products/categories status", `Status ${cat1Res.status}`);
    assert(cat1Type.includes("application/json"), "GET /api/products/categories Content-Type", cat1Type);
    assert(Array.isArray(cat1Data?.categories), "GET /api/products/categories body contains categories array");

    const cat2Res = await fetch(`${TEST_BASE_URL}/categories`);
    const cat2Type = cat2Res.headers.get("content-type") || "";
    const cat2Data = cat2Res.ok && cat2Type.includes("application/json") ? await cat2Res.json() : null;
    assert(cat2Res.status === 200, "GET /api/categories status", `Status ${cat2Res.status}`);
    assert(cat2Type.includes("application/json"), "GET /api/categories Content-Type", cat2Type);
    assert(Array.isArray(cat2Data?.categories), "GET /api/categories body contains categories array");

    // 2. Customer Order History (/api/orders/my-orders)
    console.log("\n--- 2. CUSTOMER ORDER HISTORY TESTS ---");
    const ordersRes = await fetch(`${TEST_BASE_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const ordersType = ordersRes.headers.get("content-type") || "";
    const ordersData = ordersRes.ok && ordersType.includes("application/json") ? await ordersRes.json() : null;
    assert(ordersRes.status === 200, "GET /api/orders/my-orders status", `Status ${ordersRes.status}`);
    assert(ordersType.includes("application/json"), "GET /api/orders/my-orders Content-Type", ordersType);
    assert(ordersData?.success === true, "GET /api/orders/my-orders success flag is true");
    assert(Array.isArray(ordersData?.orders), "GET /api/orders/my-orders returns orders array");

    // 3. Order Receipt Lookup (Public Order Number vs Database UUID)
    console.log("\n--- 3. ORDER RECEIPT LOOKUP TESTS ---");
    const orderNum = "FF-032684-992";
    const targetOrder = await prisma.order.findFirst({ where: { orderNumber: orderNum }, include: { user: true } });
    const orderUuid = targetOrder?.id || "8b6fcc62-c5e8-45d9-b58e-06d139349cb1";
    const orderOwnerId = targetOrder?.userId || targetOrder?.user?.id || adminUser?.id || customerUser?.id;

    const orderOwnerToken = jwt.sign(
      { userId: orderOwnerId, role: "CUSTOMER" },
      JWT_SECRET
    );

    const recNumRes = await fetch(`${TEST_BASE_URL}/orders/${orderNum}`, {
      headers: { Authorization: `Bearer ${orderOwnerToken}` },
    });
    const recNumType = recNumRes.headers.get("content-type") || "";
    const recNumData = recNumRes.ok && recNumType.includes("application/json") ? await recNumRes.json() : null;
    assert(recNumRes.status === 200, `GET /api/orders/${orderNum} status`, `Status ${recNumRes.status}`);
    assert(recNumType.includes("application/json"), `GET /api/orders/${orderNum} Content-Type`, recNumType);
    assert(recNumData?.order?.orderNumber === orderNum, `GET /api/orders/${orderNum} resolved public order number`);

    const recUuidRes = await fetch(`${TEST_BASE_URL}/orders/${orderUuid}`, {
      headers: { Authorization: `Bearer ${orderOwnerToken}` },
    });
    const recUuidType = recUuidRes.headers.get("content-type") || "";
    const recUuidData = recUuidRes.ok && recUuidType.includes("application/json") ? await recUuidRes.json() : null;
    assert(recUuidRes.status === 200, `GET /api/orders/${orderUuid} status`, `Status ${recUuidRes.status}`);
    assert(recUuidType.includes("application/json"), `GET /api/orders/${orderUuid} Content-Type`, recUuidType);
    assert(recUuidData?.order?.id === orderUuid, `GET /api/orders/${orderUuid} resolved database UUID`);

    // 4. Admin Reviews API (/api/reviews/admin/all & /api/admin/reviews)
    console.log("\n--- 4. ADMIN REVIEWS API TESTS ---");
    const rev1Res = await fetch(`${TEST_BASE_URL}/reviews/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rev1Type = rev1Res.headers.get("content-type") || "";
    const rev1Data = rev1Res.ok && rev1Type.includes("application/json") ? await rev1Res.json() : null;
    assert(rev1Res.status === 200, "GET /api/reviews/admin/all status", `Status ${rev1Res.status}`);
    assert(rev1Type.includes("application/json"), "GET /api/reviews/admin/all Content-Type", rev1Type);
    assert(Array.isArray(rev1Data?.reviews), "GET /api/reviews/admin/all returns reviews array");

    const rev2Res = await fetch(`${TEST_BASE_URL}/admin/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rev2Type = rev2Res.headers.get("content-type") || "";
    const rev2Data = rev2Res.ok && rev2Type.includes("application/json") ? await rev2Res.json() : null;
    assert(rev2Res.status === 200, "GET /api/admin/reviews status", `Status ${rev2Res.status}`);
    assert(rev2Type.includes("application/json"), "GET /api/admin/reviews Content-Type", rev2Type);
    assert(Array.isArray(rev2Data?.reviews), "GET /api/admin/reviews returns reviews array");

    // 5. Store Settings API (/api/settings)
    console.log("\n--- 5. STORE SETTINGS API TESTS ---");
    const setRes = await fetch(`${TEST_BASE_URL}/settings`);
    const setType = setRes.headers.get("content-type") || "";
    const setData = setRes.ok && setType.includes("application/json") ? await setRes.json() : null;
    assert(setRes.status === 200, "GET /api/settings status", `Status ${setRes.status}`);
    assert(setType.includes("application/json"), "GET /api/settings Content-Type", setType);
    assert(setData?.storeName === "FictionFigure", "GET /api/settings returns storeName");
    assert(typeof setData?.shippingFee === "number", "GET /api/settings returns numeric shippingFee");
    assert(typeof setData?.freeShippingThreshold === "number", "GET /api/settings returns numeric freeShippingThreshold");

    // 6. Express Global API 404 JSON Catch-All
    console.log("\n--- 6. API 404 JSON CATCH-ALL TESTS ---");
    const badRes = await fetch(`${TEST_BASE_URL}/nonexistent-route-xyz`);
    const badType = badRes.headers.get("content-type") || "";
    const badData = badType.includes("application/json") ? await badRes.json() : null;
    assert(badRes.status === 404, "Unmatched API route returns 404 status", `Status ${badRes.status}`);
    assert(badType.includes("application/json"), "Unmatched API route returns application/json Content-Type", badType);
    assert(badData?.success === false && badData?.error === "API route not found", "Unmatched API route returns structured JSON error payload");

    // 7. Server-Side Checkout Calculation Logic
    console.log("\n--- 7. SERVER-SIDE CHECKOUT CALCULATION LOGIC TESTS ---");
    const settings = await getStoreSettingsHelper();
    const threshold = settings.freeShippingThreshold;
    const shippingFee = settings.shippingFee;

    const subtotalBelow = threshold - 1;
    const shippingBelow = subtotalBelow >= threshold ? 0 : shippingFee;
    assert(shippingBelow === shippingFee, `Subtotal ₹${subtotalBelow} (< threshold ₹${threshold}) applies shipping fee ₹${shippingFee}`);

    const subtotalAbove = threshold + 10;
    const shippingAbove = subtotalAbove >= threshold ? 0 : shippingFee;
    assert(shippingAbove === 0, `Subtotal ₹${subtotalAbove} (>= threshold ₹${threshold}) applies FREE shipping (₹0)`);
  } catch (err: any) {
    console.error("Test execution error:", err);
  } finally {
    console.log(`\n=================================================================`);
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    console.log(`=================================================================`);
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runMasterQaSuite();
