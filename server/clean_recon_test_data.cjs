require('dotenv').config();
const { prisma } = require('./dist/db.js');

async function cleanTestData() {
  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { product: { name: { contains: 'Reconciliation Test' } } } }),
    prisma.product.deleteMany({ where: { name: { contains: 'Reconciliation Test' } } }),
    prisma.category.deleteMany({ where: { name: { contains: 'Cart Reconciliation' } } }),
  ]);
  console.log("✅ Cleaned temporary reconciliation test products from database!");
}

cleanTestData().catch(console.error);
