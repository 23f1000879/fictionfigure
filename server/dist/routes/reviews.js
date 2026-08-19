"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductRatingStats = updateProductRatingStats;
exports.handleGetAdminReviews = handleGetAdminReviews;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("../db.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fictionfigure_jwt_secret_key_2026";
/**
 * Helper function to recalculate product rating average and count
 */
async function updateProductRatingStats(productId) {
    try {
        const approvedReviews = await db_js_1.prisma.review.findMany({
            where: { productId, status: "APPROVED" },
            select: { rating: true },
        });
        const reviewCount = approvedReviews.length;
        let averageRating = 5.0;
        if (reviewCount > 0) {
            const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
            averageRating = Number((sum / reviewCount).toFixed(1));
        }
        await db_js_1.prisma.product.update({
            where: { id: productId },
            data: {
                rating: averageRating,
                reviewCount: reviewCount,
            },
        });
    }
    catch (err) {
        console.error("Error updating product rating stats:", err);
    }
}
/**
 * GET /api/reviews/product/:productId
 * Public endpoint to fetch approved reviews, rating distribution & summary for a product.
 * Optionally parses Bearer token to return current user's review status.
 */
router.get("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
        const sortBy = String(req.query.sortBy || "newest");
        const skip = (page - 1) * limit;
        // Resolve productId if slug was passed
        let targetProduct = await db_js_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, slug: true },
        });
        if (!targetProduct) {
            targetProduct = await db_js_1.prisma.product.findUnique({
                where: { slug: productId },
                select: { id: true, name: true, slug: true },
            });
        }
        if (!targetProduct) {
            return res.status(404).json({ error: "Product not found." });
        }
        const resolvedProductId = targetProduct.id;
        // Sorting order
        let orderBy = { createdAt: "desc" };
        if (sortBy === "highest")
            orderBy = { rating: "desc" };
        if (sortBy === "lowest")
            orderBy = { rating: "asc" };
        // Fetch all approved reviews for statistics calculation
        const allApprovedReviews = await db_js_1.prisma.review.findMany({
            where: { productId: resolvedProductId, status: "APPROVED" },
        });
        const totalCount = allApprovedReviews.length;
        let averageRating = 0;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (totalCount > 0) {
            let sum = 0;
            for (const r of allApprovedReviews) {
                sum += r.rating;
                if (distribution[r.rating] !== undefined) {
                    distribution[r.rating]++;
                }
            }
            averageRating = Number((sum / totalCount).toFixed(1));
        }
        // Paginated reviews
        const reviews = await db_js_1.prisma.review.findMany({
            where: { productId: resolvedProductId, status: "APPROVED" },
            orderBy,
            take: limit,
            skip,
            include: {
                user: { select: { firstName: true, lastName: true } },
            },
        });
        // Format author display names safely
        const formattedReviews = reviews.map((r) => {
            let displayName = r.authorName;
            if (r.user?.firstName) {
                displayName = `${r.user.firstName} ${r.user.lastName ? r.user.lastName[0] + "." : ""}`.trim();
            }
            return {
                id: r.id,
                productId: r.productId,
                orderId: r.orderId,
                authorName: displayName,
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                isVerifiedPurchase: r.isVerifiedPurchase,
                createdAt: r.createdAt,
            };
        });
        // Check optional authenticated user status
        let userReview = null;
        let canReview = false;
        let eligibleOrderId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.substring(7);
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                if (decoded?.userId) {
                    const userId = decoded.userId;
                    const user = await db_js_1.prisma.user.findUnique({ where: { id: userId } });
                    // 1. Check if user already reviewed
                    userReview = await db_js_1.prisma.review.findFirst({
                        where: {
                            productId: resolvedProductId,
                            OR: [
                                { userId },
                                ...(user?.phone ? [{ user: { phone: user.phone } }] : []),
                            ],
                        },
                    });
                    // Build flexible customer ownership filter (userId, registered phone, or shipping phone)
                    const ownerFilters = [{ userId }];
                    if (user?.phone) {
                        ownerFilters.push({ user: { phone: user.phone } });
                        ownerFilters.push({ shippingAddressJson: { contains: user.phone } });
                        const cleanPhone = user.phone.replace(/\D/g, "").slice(-10);
                        if (cleanPhone)
                            ownerFilters.push({ shippingAddressJson: { contains: cleanPhone } });
                    }
                    // 2. Check if user has a DELIVERED order for this product
                    const deliveredOrder = await db_js_1.prisma.order.findFirst({
                        where: {
                            OR: ownerFilters,
                            status: { in: ["DELIVERED", "delivered"] },
                            items: {
                                some: {
                                    OR: [
                                        { productId: resolvedProductId },
                                        { variant: { productId: resolvedProductId } },
                                    ],
                                },
                            },
                        },
                    });
                    if (deliveredOrder) {
                        canReview = true;
                        eligibleOrderId = deliveredOrder.id;
                    }
                }
            }
            catch (e) {
                // Token invalid/expired - ignore optional check
            }
        }
        res.json({
            productId: resolvedProductId,
            summary: {
                averageRating,
                totalReviews: totalCount,
                distribution,
            },
            reviews: formattedReviews,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit) || 1,
                currentPage: page,
                limit,
            },
            userReview: userReview
                ? {
                    id: userReview.id,
                    rating: userReview.rating,
                    title: userReview.title,
                    comment: userReview.comment,
                    createdAt: userReview.createdAt,
                }
                : null,
            canReview,
            eligibleOrderId,
        });
    }
    catch (err) {
        console.error("GET /api/reviews/product error:", err);
        res.status(500).json({ error: err.message || "Failed to fetch reviews." });
    }
});
/**
 * POST /api/reviews/product/:productId
 * Create a new review for a product.
 * STRICT SECURITY: Server verifies customer has a DELIVERED order containing this product.
 */
router.post("/product/:productId", auth_js_1.requireAuth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;
        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5 stars." });
        }
        if (comment && String(comment).length > 2000) {
            return res.status(400).json({ error: "Review comment cannot exceed 2000 characters." });
        }
        // Resolve productId if slug was passed
        let targetProduct = await db_js_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true },
        });
        if (!targetProduct) {
            targetProduct = await db_js_1.prisma.product.findUnique({
                where: { slug: productId },
                select: { id: true, name: true },
            });
        }
        if (!targetProduct) {
            return res.status(404).json({ error: "Product not found." });
        }
        const resolvedProductId = targetProduct.id;
        const userId = req.user.id;
        const userPhone = req.user.phone;
        // Build flexible customer ownership filter (userId, registered phone, or shipping phone)
        const ownerFilters = [{ userId }];
        if (userPhone) {
            ownerFilters.push({ user: { phone: userPhone } });
            ownerFilters.push({ shippingAddressJson: { contains: userPhone } });
            const cleanPhone = userPhone.replace(/\D/g, "").slice(-10);
            if (cleanPhone)
                ownerFilters.push({ shippingAddressJson: { contains: cleanPhone } });
        }
        // 1. STRICT SERVER-SIDE PURCHASE VERIFICATION
        const deliveredOrder = await db_js_1.prisma.order.findFirst({
            where: {
                OR: ownerFilters,
                status: { in: ["DELIVERED", "delivered"] },
                items: {
                    some: {
                        OR: [
                            { productId: resolvedProductId },
                            { variant: { productId: resolvedProductId } },
                        ],
                    },
                },
            },
        });
        if (!deliveredOrder) {
            return res.status(403).json({
                error: "Only verified customers who have purchased and received this figure can leave a review.",
            });
        }
        // 2. CHECK FOR EXISTING REVIEW (One review per customer per product)
        const existingReview = await db_js_1.prisma.review.findFirst({
            where: {
                productId: resolvedProductId,
                OR: [
                    { userId },
                    ...(userPhone ? [{ user: { phone: userPhone } }] : []),
                ],
            },
        });
        if (existingReview) {
            return res.status(400).json({
                error: "You have already reviewed this product. You can update your existing review.",
                existingReviewId: existingReview.id,
            });
        }
        // 3. FORMAT DISPLAY NAME
        const authorName = `${req.user.firstName || "Collector"} ${req.user.lastName ? req.user.lastName[0] + "." : ""}`.trim();
        // 4. CREATE VERIFIED REVIEW
        const review = await db_js_1.prisma.review.create({
            data: {
                productId: resolvedProductId,
                userId,
                orderId: deliveredOrder.id,
                authorName,
                rating: Math.round(numRating),
                title: title ? String(title).trim() : undefined,
                comment: comment ? String(comment).trim() : undefined,
                isVerifiedPurchase: true,
                status: "APPROVED",
            },
        });
        // 5. UPDATE PRODUCT RATING STATS
        await updateProductRatingStats(resolvedProductId);
        res.status(201).json({
            success: true,
            message: "Thank you! Your verified purchase review has been submitted.",
            review,
        });
    }
    catch (err) {
        console.error("POST /api/reviews/product error:", err);
        res.status(500).json({ error: err.message || "Failed to submit review." });
    }
});
/**
 * PATCH /api/reviews/:reviewId
 * Edit an existing review (only review owner or admin).
 */
router.patch("/:reviewId", auth_js_1.requireAuth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;
        const existingReview = await db_js_1.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!existingReview) {
            return res.status(404).json({ error: "Review not found." });
        }
        if (existingReview.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "You can only edit your own reviews." });
        }
        const updateData = {};
        if (rating !== undefined) {
            const numRating = Number(rating);
            if (!numRating || numRating < 1 || numRating > 5) {
                return res.status(400).json({ error: "Rating must be an integer between 1 and 5 stars." });
            }
            updateData.rating = Math.round(numRating);
        }
        if (title !== undefined)
            updateData.title = title ? String(title).trim() : null;
        if (comment !== undefined) {
            if (comment && String(comment).length > 2000) {
                return res.status(400).json({ error: "Review comment cannot exceed 2000 characters." });
            }
            updateData.comment = comment ? String(comment).trim() : null;
        }
        const updatedReview = await db_js_1.prisma.review.update({
            where: { id: reviewId },
            data: updateData,
        });
        await updateProductRatingStats(existingReview.productId);
        res.json({
            success: true,
            message: "Review updated successfully.",
            review: updatedReview,
        });
    }
    catch (err) {
        console.error("PATCH /api/reviews/:reviewId error:", err);
        res.status(500).json({ error: err.message || "Failed to update review." });
    }
});
/**
 * DELETE /api/reviews/:reviewId
 * Delete a review (only review owner or admin).
 */
router.delete("/:reviewId", auth_js_1.requireAuth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const existingReview = await db_js_1.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!existingReview) {
            return res.status(404).json({ error: "Review not found." });
        }
        if (existingReview.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "You can only delete your own reviews." });
        }
        await db_js_1.prisma.review.delete({
            where: { id: reviewId },
        });
        await updateProductRatingStats(existingReview.productId);
        res.json({
            success: true,
            message: "Review deleted successfully.",
        });
    }
    catch (err) {
        console.error("DELETE /api/reviews/:reviewId error:", err);
        res.status(500).json({ error: err.message || "Failed to delete review." });
    }
});
/**
 * GET /api/reviews/admin/all
 * GET /api/reviews/admin
 * Admin endpoint to list all customer reviews across the store.
 */
async function handleGetAdminReviews(req, res) {
    try {
        const reviews = await db_js_1.prisma.review.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                product: { select: { id: true, name: true, slug: true, images: { take: 1 } } },
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
        });
        const formatted = reviews.map((r) => ({
            id: r.id,
            productName: r.product?.name || "Unknown Figure",
            productSlug: r.product?.slug,
            productImage: r.product?.images?.[0]?.url || "",
            customerName: r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : r.authorName,
            customerPhone: r.user?.phone || "N/A",
            customerEmail: r.user?.email || "N/A",
            orderId: r.orderId,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isVerifiedPurchase: r.isVerifiedPurchase,
            status: r.status,
            createdAt: r.createdAt,
        }));
        res.json({ success: true, reviews: formatted });
    }
    catch (err) {
        console.error("GET /api/reviews/admin/all error:", err);
        res.status(500).json({ error: "Failed to fetch admin reviews." });
    }
}
router.get("/admin/all", auth_js_1.requireAdmin, handleGetAdminReviews);
router.get("/admin", auth_js_1.requireAdmin, handleGetAdminReviews);
/**
 * PATCH /api/reviews/admin/:reviewId/status
 * Admin endpoint to moderate/toggle review status (APPROVED / HIDDEN).
 */
router.patch("/admin/:reviewId/status", auth_js_1.requireAdmin, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;
        if (!["APPROVED", "HIDDEN"].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be APPROVED or HIDDEN." });
        }
        const review = await db_js_1.prisma.review.update({
            where: { id: reviewId },
            data: { status },
        });
        await updateProductRatingStats(review.productId);
        res.json({ success: true, message: `Review status updated to ${status}.`, review });
    }
    catch (err) {
        console.error("PATCH /api/reviews/admin/:reviewId/status error:", err);
        res.status(500).json({ error: err.message || "Failed to update review status." });
    }
});
exports.default = router;
