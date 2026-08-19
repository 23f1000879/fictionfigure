require('dotenv').config();

const { prisma } = require('./dist/db.js');

async function executeCleanReset() {
  console.log("=================================================");
  console.log("EXECUTING PRODUCTION DATABASE DATA-ONLY CLEAN RESET");
  console.log("=================================================");

  const PRIMARY_ADMIN_EMAIL = "admin@fictionfigure.demo";

  // Verify primary admin exists
  const primaryAdmin = await prisma.user.findFirst({
    where: { email: PRIMARY_ADMIN_EMAIL }
  });

  if (!primaryAdmin) {
    throw new Error(`CRITICAL ABORT: Primary admin account '${PRIMARY_ADMIN_EMAIL}' not found! Deletion aborted.`);
  }

  console.log(`✅ Primary Admin identified: ID: ${primaryAdmin.id} | Email: ${primaryAdmin.email}`);

  // Collect orphaned Cloudinary image URLs before deletion for report
  const productImages = await prisma.productImage.findMany({ select: { url: true } });
  const categoryImages = await prisma.category.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } });

  const cloudinaryUrls = [
    ...productImages.map(i => i.url),
    ...categoryImages.map(c => c.imageUrl),
  ].filter(url => url && url.includes('cloudinary'));

  console.log(`\n[CLOUDINARY ORPHANED ASSETS IDENTIFIED]: ${cloudinaryUrls.length} assets`);
  cloudinaryUrls.forEach(url => console.log(`- ${url}`));

  console.log("\nExecuting deletion transaction in strict foreign-key order...");

  await prisma.$transaction(async (tx) => {
    // 1. Delete dependent order & payment records
    await tx.payment.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();

    // 2. Delete customer engagement records
    await tx.review.deleteMany();
    await tx.restockRequest.deleteMany();
    await tx.wishlistItem.deleteMany();
    await tx.wishlist.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.cart.deleteMany();
    await tx.chatMessage.deleteMany();
    await tx.conversation.deleteMany();
    await tx.address.deleteMany();

    // 3. Delete marketing / discount records
    await tx.coupon.deleteMany();

    // 4. Delete catalog & inventory records
    await tx.inventoryTransaction.deleteMany();
    await tx.inventory.deleteMany();
    await tx.variantOption.deleteMany();
    await tx.productVariant.deleteMany();
    await tx.productImage.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();

    // 5. Delete test user accounts EXCEPT primary admin
    await tx.user.deleteMany({
      where: {
        id: { not: primaryAdmin.id }
      }
    });
  });

  console.log("✅ Deletion transaction completed successfully!");

  // Verify StoreSetting records remain intact
  const settingsCount = await prisma.storeSetting.count();
  const adminCount = await prisma.user.count();

  console.log(`\nPost-Reset Verification:`);
  console.log(`- Admin Users Preserved: ${adminCount}`);
  console.log(`- Store Settings Preserved: ${settingsCount}`);

  return { cloudinaryUrls };
}

executeCleanReset().catch((e) => {
  console.error("Clean Reset failed:", e);
  process.exit(1);
});
