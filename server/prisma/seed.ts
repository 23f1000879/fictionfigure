import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding FictionFigure production-safe system defaults...");

  // 1. Strict Requirement Check for Admin Credentials (NO Fallbacks)
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const rawAdminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL environment variable is required for production seed.");
  }

  if (!rawAdminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required for production seed.");
  }

  const passwordHash = await bcrypt.hash(rawAdminPassword, 10);

  // 2. Idempotent Admin Account Upsert (Email Authentication, No Hardcoded Phone)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "FictionFigure",
      lastName: "Admin",
      phone: null,
      role: "ADMIN",
      isVerified: true,
      phoneVerified: false,
    },
  });
  console.log("✔ Admin account system record verified.");

  // 3. Launch Promotion Coupon WELCOME10
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      discountType: "FIXED",
      discountValue: 100,
      minOrderValue: 2000,
      maxUsage: 500,
      isActive: true,
    },
    create: {
      code: "WELCOME10",
      discountType: "FIXED",
      discountValue: 100,
      minOrderValue: 2000,
      maxUsage: 500,
      usedCount: 0,
      isActive: true,
    },
  });
  console.log("✔ Launch coupon WELCOME10 verified.");

  // 4. Initial Store Settings (Editable in /admin/settings)
  const initialSettings = [
    { key: "hero_announcement", value: "Welcome to FictionFigure — Collect what you love." },
    { key: "free_shipping_threshold", value: "1500" },
    { key: "low_stock_threshold", value: "5" },
  ];

  for (const setting of initialSettings) {
    await prisma.storeSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log("✔ Initial store settings verified.");

  console.log("Production seed script completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed execution error:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
