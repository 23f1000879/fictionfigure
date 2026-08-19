import jwt from "jsonwebtoken";
import { prisma } from "./src/db.js";

const PUBLIC_API = "https://api.fictionfigures.in/api";
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

async function runProductionSmokeTest() {
  console.log("=================================================================");
  console.log("     PUBLIC PRODUCTION SMOKE TEST AT https://api.fictionfigures.in ");
  console.log("=================================================================\n");

  const results: Record<string, string> = {};

  // 1. Version Endpoint
  try {
    const res = await fetch(`${PUBLIC_API}/version`);
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`1. GET /api/version -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["/api/version"] = res.status === 200 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("1. GET /api/version -> ERROR:", e.message);
    results["/api/version"] = "FAIL";
  }

  // 2. Products Categories Endpoint
  try {
    const res = await fetch(`${PUBLIC_API}/products/categories`);
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`\n2. GET /api/products/categories -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["/api/products/categories"] = res.status === 200 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("2. GET /api/products/categories -> ERROR:", e.message);
    results["/api/products/categories"] = "FAIL";
  }

  // 3. Categories Endpoint
  try {
    const res = await fetch(`${PUBLIC_API}/categories`);
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`\n3. GET /api/categories -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["/api/categories"] = res.status === 200 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("3. GET /api/categories -> ERROR:", e.message);
    results["/api/categories"] = "FAIL";
  }

  // 4. Settings Endpoint
  try {
    const res = await fetch(`${PUBLIC_API}/settings`);
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`\n4. GET /api/settings -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["/api/settings"] = res.status === 200 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("4. GET /api/settings -> ERROR:", e.message);
    results["/api/settings"] = "FAIL";
  }

  // 5. Authenticated Order History Endpoint
  try {
    const targetOrder = await prisma.order.findFirst({
      where: { orderNumber: "FF-032684-992" },
      include: { user: true },
    });
    const orderOwnerId = targetOrder?.userId || targetOrder?.user?.id;
    const token = jwt.sign({ userId: orderOwnerId, role: "CUSTOMER" }, JWT_SECRET);

    const res = await fetch(`${PUBLIC_API}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`\n5. GET /api/orders/my-orders -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["/api/orders/my-orders"] = res.status === 200 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("5. GET /api/orders/my-orders -> ERROR:", e.message);
    results["/api/orders/my-orders"] = "FAIL";
  }

  // 6. Unknown Route JSON 404 Catch-All
  try {
    const res = await fetch(`${PUBLIC_API}/unknown-route-test-xyz`);
    const type = res.headers.get("content-type") || "";
    const text = await res.text();
    console.log(`\n6. GET /api/unknown-route-test-xyz -> Status ${res.status} (${type})`);
    console.log(`   Response: ${text.slice(0, 150)}`);
    results["Unknown /api route"] = res.status === 404 && type.includes("application/json") ? "PASS" : "FAIL";
  } catch (e: any) {
    console.log("6. Unknown route -> ERROR:", e.message);
    results["Unknown /api route"] = "FAIL";
  }

  console.log("\n=================================================================");
  console.log("SMOKE TEST RESULTS SUMMARY:");
  console.table(results);
  console.log("=================================================================");

  await prisma.$disconnect();
}

runProductionSmokeTest();
