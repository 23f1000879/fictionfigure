const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { prisma } = require('./dist/db.js');

async function dumpBackup() {
  console.log("=================================================");
  console.log("CREATING FULL PRODUCTION DATABASE JSON BACKUP");
  console.log("=================================================");

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `db_backup_${timestamp}.json`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] || "Neon PostgreSQL" : "Local",
      version: "6dc2262",
    },
    tables: {
      users: await prisma.user.findMany(),
      addresses: await prisma.address.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      productImages: await prisma.productImage.findMany(),
      productVariants: await prisma.productVariant.findMany(),
      variantOptions: await prisma.variantOption.findMany(),
      inventories: await prisma.inventory.findMany(),
      inventoryTransactions: await prisma.inventoryTransaction.findMany(),
      carts: await prisma.cart.findMany(),
      cartItems: await prisma.cartItem.findMany(),
      wishlists: await prisma.wishlist.findMany(),
      wishlistItems: await prisma.wishlistItem.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      payments: await prisma.payment.findMany(),
      coupons: await prisma.coupon.findMany(),
      reviews: await prisma.review.findMany(),
      conversations: await prisma.conversation.findMany(),
      chatMessages: await prisma.chatMessage.findMany(),
      restockRequests: await prisma.restockRequest.findMany(),
      storeSettings: await prisma.storeSetting.findMany(),
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));

  const stats = fs.statSync(backupFilePath);
  console.log(`✅ DATABASE BACKUP CREATED SUCCESSFULLY!`);
  console.log(`FilePath: ${backupFilePath}`);
  console.log(`SizeBytes: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

  return backupFilePath;
}

dumpBackup().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
