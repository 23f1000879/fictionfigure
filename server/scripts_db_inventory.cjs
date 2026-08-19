require('dotenv').config();

const { prisma } = require('./dist/db.js');

async function inspectDatabase() {
  console.log("=================================================");
  console.log("PRE-RESET DATABASE RECORD COUNTS SUMMARY");
  console.log("=================================================");

  const models = [
    { name: "User", model: prisma.user },
    { name: "Address", model: prisma.address },
    { name: "Category", model: prisma.category },
    { name: "Product", model: prisma.product },
    { name: "ProductImage", model: prisma.productImage },
    { name: "ProductVariant", model: prisma.productVariant },
    { name: "VariantOption", model: prisma.variantOption },
    { name: "Inventory", model: prisma.inventory },
    { name: "InventoryTransaction", model: prisma.inventoryTransaction },
    { name: "Cart", model: prisma.cart },
    { name: "CartItem", model: prisma.cartItem },
    { name: "Wishlist", model: prisma.wishlist },
    { name: "WishlistItem", model: prisma.wishlistItem },
    { name: "Order", model: prisma.order },
    { name: "OrderItem", model: prisma.orderItem },
    { name: "Payment", model: prisma.payment },
    { name: "Coupon", model: prisma.coupon },
    { name: "Review", model: prisma.review },
    { name: "Conversation", model: prisma.conversation },
    { name: "ChatMessage", model: prisma.chatMessage },
    { name: "RestockRequest", model: prisma.restockRequest },
    { name: "StoreSetting", model: prisma.storeSetting },
  ];

  for (const m of models) {
    const count = await m.model.count();
    console.log(`${m.name.padEnd(22)} : ${count}`);
  }

  console.log("\n=================================================");
  console.log("USERS AUDIT:");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  });
  for (const u of users) {
    console.log(`User [${u.role.padEnd(8)}] ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName} ${u.lastName}`);
  }
}

inspectDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
