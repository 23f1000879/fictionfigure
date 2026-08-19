import jwt from "jsonwebtoken";
import { handleGetOrderDetails } from "./src/routes/orders.js";
import { prisma } from "./src/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

async function testAllOrders() {
  try {
    console.log("=== TESTING ALL ORDERS IN DATABASE FOR ACCESS ISSUES ===");

    const allOrders = await prisma.order.findMany({
      include: {
        user: true,
      },
    });

    console.log(`Total orders found in DB: ${allOrders.length}`);

    const users = await prisma.user.findMany();
    console.log(`Total users found in DB: ${users.length}`);

    const createMockReqRes = (orderId: string, token?: string) => {
      const req: any = {
        params: { id: orderId },
        headers: token ? { authorization: `Bearer ${token}` } : {},
      };
      let responseData: any = null;
      let statusCode = 200;

      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (data: any) => {
          responseData = data;
          return res;
        },
      };

      return { req, res, getResult: () => ({ statusCode, responseData }) };
    };

    for (const order of allOrders) {
      console.log(`\n--------------------------------------------------`);
      console.log(`ORDER ID: ${order.id}`);
      console.log(`ORDER NUMBER: ${order.orderNumber}`);
      console.log(`ORDER STATUS: ${order.status}`);
      console.log(`ORDER userId: ${order.userId}`);
      console.log(`ORDER userPhone: ${order.user?.phone}`);
      console.log(`ORDER shippingAddressJson: ${order.shippingAddressJson}`);

      // Test 1: Query by UUID (order.id) with owner token
      let ownerToken = "";
      if (order.user) {
        ownerToken = jwt.sign({ userId: order.user.id, role: order.user.role }, JWT_SECRET);
      } else if (order.shippingAddressJson) {
        try {
          const parsed = JSON.parse(order.shippingAddressJson);
          if (parsed.phone) {
            const u = users.find(usr => usr.phone === parsed.phone);
            if (u) ownerToken = jwt.sign({ userId: u.id, role: u.role }, JWT_SECRET);
          }
        } catch (e) {}
      }

      const { req: reqId, res: resId, getResult: getResultId } = createMockReqRes(order.id, ownerToken);
      await handleGetOrderDetails(reqId, resId);
      const resIdResult = getResultId();

      console.log(`Lookup by UUID (${order.id}) with owner token: Status ${resIdResult.statusCode}`, resIdResult.statusCode === 200 ? "SUCCESS" : resIdResult.responseData);

      // Test 2: Query by Order Number (order.orderNumber) with owner token
      const { req: reqNum, res: resNum, getResult: getResultNum } = createMockReqRes(order.orderNumber, ownerToken);
      await handleGetOrderDetails(reqNum, resNum);
      const resNumResult = getResultNum();

      console.log(`Lookup by OrderNumber (${order.orderNumber}) with owner token: Status ${resNumResult.statusCode}`, resNumResult.statusCode === 200 ? "SUCCESS" : resNumResult.responseData);
    }

  } catch (err) {
    console.error("Error testing orders:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testAllOrders();
