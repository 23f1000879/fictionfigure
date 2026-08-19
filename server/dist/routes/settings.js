"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.clearSettingsCache = clearSettingsCache;
exports.getStoreSettingsHelper = getStoreSettingsHelper;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
exports.DEFAULT_SETTINGS = {
    shipping_fee: "100",
    free_shipping_threshold: "500",
    cod_enabled: "true",
    cod_fee: "0",
    store_name: "FictionFigure",
    store_location: "Bikaner, Rajasthan",
    delivery_coverage: "Delivering across India",
    support_phone: "+91 97974 94639",
    support_email: "support@fictionfigure.in",
    support_hours: "Monday - Saturday, 10:00 AM - 7:00 PM",
    announcements_json: JSON.stringify([
        {
            id: "1",
            text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.",
            enabled: true,
            sortOrder: 1,
        },
        {
            id: "2",
            text: "FREE SHIPPING ON ORDERS OF ₹{{FREE_SHIPPING_THRESHOLD}} OR MORE.",
            enabled: true,
            sortOrder: 2,
        },
        {
            id: "3",
            text: "LIMITED EDITION COLLECTIBLES AVAILABLE NOW.",
            enabled: true,
            sortOrder: 3,
        },
    ]),
    hero_announcement: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.",
    hero_title: "Figures worth collecting.",
    hero_subtitle: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
    free_shipping_min: "500",
    tax_rate_percentage: "18",
    return_policy_days: "14",
    upi_id: process.env.UPI_ID || "fictionfigure@upi",
    upi_qr_url: process.env.UPI_QR_URL || "https://res.cloudinary.com/demo/image/upload/v1/upi-qr-sample.png",
    // Homepage Hero CMS Settings
    homepage_hero_enabled: "true",
    homepage_hero_image_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    homepage_hero_eyebrow: "CURATED COLLECTOR GALLERY",
    homepage_hero_title: "Figures worth collecting.",
    homepage_hero_title_accent: "Stories worth keeping.",
    homepage_hero_description: "Curated figures, statues, and collectible pieces for people who never stopped loving the characters that shaped them.",
    homepage_hero_primary_label: "SHOP COLLECTION",
    homepage_hero_primary_url: "/shop",
    homepage_hero_secondary_label: "EXPLORE NEW ARRIVALS",
    homepage_hero_secondary_url: "/shop?sortBy=newest",
    homepage_hero_featured_product_id: "",
};
let cachedSettingsPayload = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds memory cache
function clearSettingsCache() {
    cachedSettingsPayload = null;
    lastCacheTime = 0;
}
async function getStoreSettingsHelper() {
    try {
        const dbSettings = await prisma.storeSetting.findMany();
        const settingsMap = { ...exports.DEFAULT_SETTINGS };
        dbSettings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });
        const shippingFee = Math.max(0, parseFloat(settingsMap.shipping_fee || "100") || 100);
        const freeShippingThreshold = Math.max(0, parseFloat(settingsMap.free_shipping_threshold || "500") || 500);
        return {
            settingsMap,
            shippingFee,
            freeShippingThreshold,
            storeLocation: settingsMap.store_location || "Bikaner, Rajasthan, India",
            deliveryCoverage: settingsMap.delivery_coverage || "We deliver across India.",
        };
    }
    catch (e) {
        return {
            settingsMap: exports.DEFAULT_SETTINGS,
            shippingFee: 100,
            freeShippingThreshold: 500,
            storeLocation: "Bikaner, Rajasthan, India",
            deliveryCoverage: "We deliver across India.",
        };
    }
}
// 1. Fetch All Dynamic Store Settings for Storefront
router.get("/", async (_req, res) => {
    try {
        const now = Date.now();
        if (cachedSettingsPayload && now - lastCacheTime < CACHE_TTL_MS) {
            return res.json(cachedSettingsPayload);
        }
        const { settingsMap, shippingFee, freeShippingThreshold, storeLocation, deliveryCoverage } = await getStoreSettingsHelper();
        // Parse and expand announcements
        let rawAnnouncements = [];
        try {
            if (settingsMap.announcements_json) {
                rawAnnouncements = JSON.parse(settingsMap.announcements_json);
            }
        }
        catch (e) { }
        if (!Array.isArray(rawAnnouncements) || rawAnnouncements.length === 0) {
            rawAnnouncements = JSON.parse(exports.DEFAULT_SETTINGS.announcements_json);
        }
        const processedAnnouncements = rawAnnouncements
            .filter((a) => a && a.enabled !== false)
            .map((a) => {
            let expandedText = a.text || "";
            expandedText = expandedText.replace(/\{\{FREE_SHIPPING_THRESHOLD\}\}/g, freeShippingThreshold.toLocaleString("en-IN"));
            return {
                id: a.id || String(Math.random()),
                text: expandedText,
                enabled: true,
                sortOrder: a.sortOrder || 0,
            };
        })
            .sort((a, b) => a.sortOrder - b.sortOrder);
        let featuredProduct = null;
        if (settingsMap.homepage_hero_featured_product_id) {
            const prod = await prisma.product.findUnique({
                where: { id: settingsMap.homepage_hero_featured_product_id },
                include: { images: true },
            });
            if (prod) {
                featuredProduct = {
                    id: prod.id,
                    name: prod.name,
                    slug: prod.slug,
                    sku: prod.sku,
                    imageUrl: prod.images[0]?.url || "",
                };
            }
        }
        const resolveStringSetting = (key) => {
            return settingsMap[key] !== undefined ? settingsMap[key] : (exports.DEFAULT_SETTINGS[key] || "");
        };
        cachedSettingsPayload = {
            success: true,
            settings: settingsMap,
            storeName: resolveStringSetting("store_name"),
            shippingFee,
            freeShippingThreshold,
            storeLocation: resolveStringSetting("store_location"),
            deliveryCoverage: resolveStringSetting("delivery_coverage"),
            supportPhone: resolveStringSetting("support_phone"),
            supportEmail: resolveStringSetting("support_email"),
            supportHours: resolveStringSetting("support_hours"),
            announcements: processedAnnouncements,
            featuredProduct,
        };
        lastCacheTime = now;
        res.json(cachedSettingsPayload);
    }
    catch (err) {
        res.json({
            success: false,
            settings: exports.DEFAULT_SETTINGS,
            storeName: "FictionFigure",
            shippingFee: 100,
            freeShippingThreshold: 500,
            storeLocation: "Bikaner, Rajasthan",
            deliveryCoverage: "Delivering across India",
            supportPhone: "+91 97974 94639",
            supportEmail: "support@fictionfigure.in",
            supportHours: "Monday - Saturday, 10:00 AM - 7:00 PM",
            announcements: [
                { id: "1", text: "WELCOME TO FICTIONFIGURE — COLLECT WHAT YOU LOVE.", enabled: true, sortOrder: 1 },
                { id: "2", text: "FREE SHIPPING ON ORDERS OF ₹500 OR MORE.", enabled: true, sortOrder: 2 },
            ],
            featuredProduct: null,
        });
    }
});
// 2. Single Key Patch (Fallback)
router.patch("/", async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || typeof value !== "string") {
            return res.status(400).json({ error: "Setting key and string value required" });
        }
        const updated = await prisma.storeSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
        clearSettingsCache();
        res.json({ success: true, setting: updated });
    }
    catch (err) {
        res.status(500).json({ error: err.message || "Failed to update store setting" });
    }
});
exports.default = router;
