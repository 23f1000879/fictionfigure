"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding FictionFigure database in server...");
    await prisma.chatMessage.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.variantOption.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});
    const adminPassword = await bcryptjs_1.default.hash("admin123", 10);
    const customerPassword = await bcryptjs_1.default.hash("collector123", 10);
    const admin = await prisma.user.create({
        data: {
            email: "admin@fictionfigure.demo",
            passwordHash: adminPassword,
            firstName: "FictionFigure",
            lastName: "Admin",
            phone: "+91 98765 43210",
            role: "ADMIN",
        },
    });
    const collector = await prisma.user.create({
        data: {
            email: "collector@fictionfigure.demo",
            passwordHash: customerPassword,
            firstName: "Ren",
            lastName: "Amamiya",
            phone: "+91 98123 45678",
            role: "CUSTOMER",
            addresses: {
                create: [
                    {
                        fullName: "Ren Amamiya",
                        streetAddress: "42 Shibuya Crossing Apt 4B",
                        apartment: "Suite 4B",
                        city: "Mumbai",
                        state: "Maharashtra",
                        postalCode: "400001",
                        country: "India",
                        phone: "+91 98123 45678",
                        isDefault: true,
                    },
                ],
            },
        },
    });
    const animeCat = await prisma.category.create({
        data: {
            name: "Anime Figures",
            slug: "anime-figures",
            description: "Authentic scale figures and static displays from iconic Japanese anime series.",
            imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        },
    });
    const statueCat = await prisma.category.create({
        data: {
            name: "Premium Statues",
            slug: "premium-statues",
            description: "Large format polyresin and cold-cast resin statues engineered for serious art displays.",
            imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
        },
    });
    await prisma.coupon.createMany({
        data: [
            {
                code: "WELCOME10",
                discountType: "PERCENTAGE",
                discountValue: 10,
                minOrderValue: 2000,
                maxUsage: 500,
                usedCount: 14,
                isActive: true,
            },
        ],
    });
    console.log("Server database seeding finished successfully.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
