import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * CUSTOMER ENDPOINTS
 */

// 1. Create or Update Restock Request (Customer)
router.post("/", requireAuth, async (req: any, res: any) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    const desiredQty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    // Check if customer already has an active PENDING request for this product
    const existingRequest = await prisma.restockRequest.findFirst({
      where: {
        productId,
        userId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      const updated = await prisma.restockRequest.update({
        where: { id: existingRequest.id },
        data: {
          quantity: desiredQty,
          updatedAt: new Date(),
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return res.json({
        success: true,
        message: "Restock request quantity updated successfully.",
        request: updated,
        isUpdate: true,
      });
    }

    const newRequest = await prisma.restockRequest.create({
      data: {
        productId,
        userId,
        quantity: desiredQty,
        status: "PENDING",
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "You're on the restock list! We will notify you when this item is back in stock.",
      request: newRequest,
      isUpdate: false,
    });
  } catch (err: any) {
    console.error("POST /api/restock-requests error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to submit restock request." });
  }
});

// 2. Get Authenticated Customer's Restock Requests
router.get("/my", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.restockRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { isPrimary: "desc" },
            },
            variants: {
              take: 1,
              select: { inventoryCount: true, price: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      requests,
    });
  } catch (err: any) {
    console.error("GET /api/restock-requests/my error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch your restock requests." });
  }
});

// 3. Update Customer's Pending Restock Request Quantity
router.patch("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const request = await prisma.restockRequest.findUnique({
      where: { id },
    });

    if (!request || request.userId !== userId) {
      return res.status(404).json({ success: false, error: "Restock request not found." });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ success: false, error: "Only pending requests can be updated." });
    }

    const desiredQty = Math.max(1, parseInt(quantity, 10) || 1);

    const updated = await prisma.restockRequest.update({
      where: { id },
      data: { quantity: desiredQty },
    });

    res.json({
      success: true,
      message: "Quantity updated successfully.",
      request: updated,
    });
  } catch (err: any) {
    console.error("PATCH /api/restock-requests/:id error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to update request." });
  }
});

// 4. Cancel/Delete Customer's Restock Request
router.delete("/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await prisma.restockRequest.findUnique({
      where: { id },
    });

    if (!request || request.userId !== userId) {
      return res.status(404).json({ success: false, error: "Restock request not found." });
    }

    const updated = await prisma.restockRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.json({
      success: true,
      message: "Restock request cancelled.",
      request: updated,
    });
  } catch (err: any) {
    console.error("DELETE /api/restock-requests/:id error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to cancel restock request." });
  }
});

/**
 * ADMIN ENDPOINTS
 */

// 5. Admin Restock Demand KPI Summary
router.get("/admin/summary", requireAdmin, async (_req: any, res: any) => {
  try {
    const pendingRequests = await prisma.restockRequest.findMany({
      where: { status: "PENDING" },
      select: { productId: true, userId: true, quantity: true },
    });

    const uniqueProductIds = new Set(pendingRequests.map((r) => r.productId));
    const uniqueUserIds = new Set(pendingRequests.map((r) => r.userId));
    const totalRequestedUnits = pendingRequests.reduce((sum, r) => sum + r.quantity, 0);

    // Calculate top demand product
    const productUnitsMap: Record<string, number> = {};
    pendingRequests.forEach((r) => {
      productUnitsMap[r.productId] = (productUnitsMap[r.productId] || 0) + r.quantity;
    });

    let topProductId = "";
    let maxUnits = 0;
    Object.entries(productUnitsMap).forEach(([pId, units]) => {
      if (units > maxUnits) {
        maxUnits = units;
        topProductId = pId;
      }
    });

    let topProductInfo = null;
    if (topProductId) {
      const topProd = await prisma.product.findUnique({
        where: { id: topProductId },
        select: { id: true, name: true, slug: true },
      });
      if (topProd) {
        topProductInfo = {
          id: topProd.id,
          name: topProd.name,
          slug: topProd.slug,
          requestedUnits: maxUnits,
        };
      }
    }

    res.json({
      success: true,
      summary: {
        totalProductsRequested: uniqueProductIds.size,
        totalPendingCustomers: uniqueUserIds.size,
        totalRequestedUnits,
        totalPendingRequests: pendingRequests.length,
        topDemandedProduct: topProductInfo,
      },
    });
  } catch (err: any) {
    console.error("GET /api/restock-requests/admin/summary error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch restock summary." });
  }
});

// 5b. Admin Restock Demand Analytics & Stock Health Integration
router.get("/admin/analytics", requireAdmin, async (_req: any, res: any) => {
  try {
    const pendingRequests = await prisma.restockRequest.findMany({
      where: { status: "PENDING" },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { isPrimary: "desc" } },
            variants: { take: 1, select: { inventoryCount: true } },
          },
        },
      },
    });

    const uniqueProductIds = new Set(pendingRequests.map((r) => r.productId));
    const uniqueUserIds = new Set(pendingRequests.map((r) => r.userId));
    const totalRequestedUnits = pendingRequests.reduce((sum, r) => sum + r.quantity, 0);

    // Group demand by product
    const productGroupMap: Record<string, any> = {};

    pendingRequests.forEach((reqItem) => {
      const p = reqItem.product;
      if (!p) return;

      if (!productGroupMap[p.id]) {
        productGroupMap[p.id] = {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          imageUrl: p.images[0]?.url || "",
          currentStock: p.variants[0]?.inventoryCount ?? 0,
          uniqueUserIds: new Set<string>(),
          totalRequestedUnits: 0,
          pendingRequestsCount: 0,
        };
      }

      const g = productGroupMap[p.id];
      g.uniqueUserIds.add(reqItem.userId);
      g.totalRequestedUnits += reqItem.quantity;
      g.pendingRequestsCount += 1;
    });

    const topDemandProducts = Object.values(productGroupMap).map((g) => {
      const uniqueCustomers = g.uniqueUserIds.size;
      const totalUnits = g.totalRequestedUnits;

      let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
      if (uniqueCustomers >= 10 || totalUnits >= 20) {
        priority = "HIGH";
      } else if (uniqueCustomers >= 5 || totalUnits >= 10) {
        priority = "MEDIUM";
      }

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        sku: g.sku,
        imageUrl: g.imageUrl,
        currentStock: g.currentStock,
        uniqueCustomers,
        totalRequestedUnits: totalUnits,
        pendingRequestsCount: g.pendingRequestsCount,
        priority,
      };
    });

    // Sort by totalRequestedUnits DESC
    topDemandProducts.sort((a, b) => b.totalRequestedUnits - a.totalRequestedUnits);

    // Stock health alerts calculation
    const allProducts = await prisma.product.findMany({
      include: {
        variants: { select: { inventoryCount: true } },
      },
    });

    let outOfStockCount = 0;
    let outOfStockWithDemandCount = 0;

    allProducts.forEach((p) => {
      const stock = p.variants[0]?.inventoryCount ?? 0;
      if (stock <= 0) {
        outOfStockCount += 1;
        if (uniqueProductIds.has(p.id)) {
          outOfStockWithDemandCount += 1;
        }
      }
    });

    res.json({
      success: true,
      analytics: {
        productsRequested: uniqueProductIds.size,
        customersWaiting: uniqueUserIds.size,
        unitsRequested: totalRequestedUnits,
        topDemandProducts,
        stockHealth: {
          totalOutOfStock: outOfStockCount,
          outOfStockWithDemand: outOfStockWithDemandCount,
          totalUnitsRequested: totalRequestedUnits,
        },
      },
    });
  } catch (err: any) {
    console.error("GET /api/restock-requests/admin/analytics error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch restock analytics." });
  }
});

// 6. Admin Aggregated Product Restock Demand List
router.get("/admin/list", requireAdmin, async (req: any, res: any) => {
  try {
    const { status = "PENDING", search = "", sort = "highest_demand" } = req.query;

    const statusFilter = status === "ALL" ? undefined : (status as any);

    // Fetch restock requests with product and user details
    const requests = await prisma.restockRequest.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { isPrimary: "desc" },
            },
            variants: {
              take: 1,
              select: { inventoryCount: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group requests by product
    const productGroupMap: Record<string, any> = {};

    requests.forEach((reqItem) => {
      const p = reqItem.product;
      if (!p) return;

      // Filter by search query if present
      if (search) {
        const query = String(search).toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSlug = p.slug.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug && !matchesSku) return;
      }

      if (!productGroupMap[p.id]) {
        productGroupMap[p.id] = {
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          productSku: p.sku,
          productImage: p.images[0]?.url || "",
          currentStock: p.variants[0]?.inventoryCount ?? 0,
          uniqueUserIds: new Set<string>(),
          totalRequestedUnits: 0,
          pendingRequestsCount: 0,
          fulfilledRequestsCount: 0,
          latestRequestAt: reqItem.createdAt,
          requests: [],
        };
      }

      const group = productGroupMap[p.id];
      if (reqItem.status === "PENDING") {
        group.uniqueUserIds.add(reqItem.userId);
        group.totalRequestedUnits += reqItem.quantity;
        group.pendingRequestsCount += 1;
      } else if (reqItem.status === "FULFILLED") {
        group.fulfilledRequestsCount += 1;
      }

      if (new Date(reqItem.createdAt) > new Date(group.latestRequestAt)) {
        group.latestRequestAt = reqItem.createdAt;
      }

      group.requests.push({
        id: reqItem.id,
        userId: reqItem.userId,
        userName: `${reqItem.user?.firstName || "Customer"} ${reqItem.user?.lastName || ""}`.trim(),
        userPhone: reqItem.user?.phone || "N/A",
        userEmail: reqItem.user?.email || "N/A",
        quantity: reqItem.quantity,
        status: reqItem.status,
        createdAt: reqItem.createdAt,
        fulfilledAt: reqItem.fulfilledAt,
      });
    });

    const productDemandList = Object.values(productGroupMap).map((g) => ({
      ...g,
      uniqueCustomers: g.uniqueUserIds.size,
      uniqueUserIds: undefined,
    }));

    // Sorting logic
    productDemandList.sort((a: any, b: any) => {
      if (sort === "most_customers") {
        return b.uniqueCustomers - a.uniqueCustomers;
      }
      if (sort === "newest") {
        return new Date(b.latestRequestAt).getTime() - new Date(a.latestRequestAt).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.latestRequestAt).getTime() - new Date(b.latestRequestAt).getTime();
      }
      // Default: highest_demand (totalRequestedUnits DESC)
      return b.totalRequestedUnits - a.totalRequestedUnits;
    });

    res.json({
      success: true,
      products: productDemandList,
    });
  } catch (err: any) {
    console.error("GET /api/restock-requests/admin/list error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch aggregated demand." });
  }
});

// 7. Admin Single Product Restock Detail
router.get("/admin/product/:productId", requireAdmin, async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { take: 1, orderBy: { isPrimary: "desc" } },
        variants: { take: 1, select: { inventoryCount: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    const requests = await prisma.restockRequest.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    const uniqueCustomers = new Set(pendingRequests.map((r) => r.userId)).size;
    const totalRequestedUnits = pendingRequests.reduce((sum, r) => sum + r.quantity, 0);

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        imageUrl: product.images[0]?.url || "",
        currentStock: product.variants[0]?.inventoryCount ?? 0,
        uniqueCustomers,
        totalRequestedUnits,
        pendingRequestsCount: pendingRequests.length,
        fulfilledRequestsCount: requests.filter((r) => r.status === "FULFILLED").length,
      },
      requests: requests.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: `${r.user?.firstName || "Customer"} ${r.user?.lastName || ""}`.trim(),
        userPhone: r.user?.phone || "N/A",
        userEmail: r.user?.email || "N/A",
        quantity: r.quantity,
        status: r.status,
        createdAt: r.createdAt,
        fulfilledAt: r.fulfilledAt,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/restock-requests/admin/product/:productId error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch product restock details." });
  }
});

// 8. Admin Fulfill Pending Restock Requests for Product
router.post("/admin/fulfill/:productId", requireAdmin, async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    const result = await prisma.restockRequest.updateMany({
      where: {
        productId,
        status: "PENDING",
      },
      data: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: `Successfully marked ${result.count} pending restock requests as FULFILLED.`,
      fulfilledCount: result.count,
    });
  } catch (err: any) {
    console.error("POST /api/restock-requests/admin/fulfill/:productId error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fulfill restock requests." });
  }
});

export default router;
