import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_SETTINGS: Record<string, string> = {
  hero_announcement: "Complimentary Worldwide Express Shipping on Collectible Statues over ₹15,000",
  hero_title: "Figures worth collecting. Stories worth keeping.",
  hero_subtitle: "Curated 1/6 scale figures, polystone statues, and designer vinyl pieces for serious collectors.",
  store_contact_email: "concierge@fictionfigure.com",
  store_contact_phone: "+91 98765 43210",
  free_shipping_min: "15000",
  tax_rate_percentage: "18",
  return_policy_days: "14",
};

// 1. Fetch All Dynamic Store Settings
router.get("/", async (req, res) => {
  try {
    const dbSettings = await prisma.storeSetting.findMany();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({ settings: settingsMap });
  } catch (err: any) {
    res.json({ settings: DEFAULT_SETTINGS });
  }
});

// 2. Update Dynamic Store Setting (Admin)
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

    res.json({ success: true, setting: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update store setting" });
  }
});

export default router;
