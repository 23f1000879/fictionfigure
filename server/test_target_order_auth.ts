import jwt from "jsonwebtoken";
import { handleGetOrderDetails } from "./src/routes/orders.js";
import { prisma } from "./src/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";

async function testTargetOrder() {
  try {
    console.log("=== TESTING API LOOKUP FOR FF-032684-992 ===");
    const targetOrderNumber = "FF-032684-992";

    const order = await prisma.order.findUnique({
      where: { orderNumber: targetOrderNumber },
      include: { user: true },
    });

    if (!order) {
      console.log(`Order ${targetOrderNumber} not found in database!`);
      return;
    }

    console.log("Found Order:", {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      phone: order.user?.phone,
    });

    const userToken = jwt.sign({ userId: order.userId, role: order.user?.role || "CUSTOMER" }, JWT_SECRET);
    const otherToken = jwt.sign({ userId: "different_user_uuid", role: "CUSTOMER" }, JWT_SECRET);

    const createMockReqRes = (paramId: string, token?: string) => {
      const req: any = {
        params: { id: paramId },
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

    // TEST A: Query by orderNumber (FF-032684-992) with owner token
    console.log("\n--- TEST A: Query by OrderNumber (FF-032684-992) with Owner Token ---");
    const { req: reqA, res: resA, getResult: getResultA } = createMockReqRes(targetOrderNumber, userToken);
    await handleGetOrderDetails(reqA, resA);
    const resAVal = getResultA();
    console.log("Status Code:", resAVal.statusCode);
    console.log("Success Result:", resAVal.statusCode === 200 ? "OK" : resAVal.responseData);

    // TEST B: Query by UUID (8b6fcc62-c5e8-45d9-b58e-06d139349cb1) with owner token
    console.log("\n--- TEST B: Query by UUID with Owner Token ---");
    const { req: reqB, res: resB, getResult: getResultB } = createMockReqRes(order.id, userToken);
    await handleGetOrderDetails(reqB, resB);
    const resBVal = getResultB();
    console.log("Status Code:", resBVal.statusCode);
    console.log("Success Result:", resBVal.statusCode === 200 ? "OK" : resBVal.responseData);

    // TEST C: Query by orderNumber WITHOUT token (Unauthenticated)
    console.log("\n--- TEST C: Query by OrderNumber WITHOUT Token ---");
    const { req: reqC, res: resC, getResult: getResultC } = createMockReqRes(targetOrderNumber);
    await handleGetOrderDetails(reqC, resC);
    const resCVal = getResultC();
    console.log("Status Code:", resCVal.statusCode);
    console.log("Response:", resCVal.responseData);

    // TEST D: Query by orderNumber with ANOTHER user's token
    console.log("\n--- TEST D: Query by OrderNumber with Other User Token ---");
    const { req: reqD, res: resD, getResult: getResultD } = createMockReqRes(targetOrderNumber, otherToken);
    await handleGetOrderDetails(reqD, resD);
    const resDVal = getResultD();
    console.log("Status Code:", resDVal.statusCode);
    console.log("Response:", resDVal.responseData);

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testTargetOrder();
