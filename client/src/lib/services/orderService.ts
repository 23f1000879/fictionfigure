import { prisma } from "@/lib/db/prisma";
import { CheckoutInput } from "@/lib/schemas/cart";
import { getOrCreateCart } from "./cartService";

export async function calculateCartSummary({
  userId,
  guestToken,
  couponCode,
  shippingMethod = "Standard Shipping",
}: {
  userId?: string;
  guestToken?: string;
  couponCode?: string;
  shippingMethod?: string;
}) {
  const cart = await getOrCreateCart(userId, guestToken);

  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.variant.price * item.quantity;
  }

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUsage) {
      if (subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = (subtotal * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
        appliedCoupon = coupon;
      }
    }
  }

  const shippingAmount = shippingMethod === "Express Courier" ? 500 : subtotal > 10000 ? 0 : 350;
  const taxAmount = 0; // Prices are inclusive of tax
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);

  return {
    cart,
    subtotal,
    discountAmount,
    shippingAmount,
    taxAmount,
    totalAmount,
    appliedCoupon,
  };
}

export async function createOrderFromCheckout({
  checkoutInput,
  userId,
  guestToken,
}: {
  checkoutInput: CheckoutInput;
  userId?: string;
  guestToken?: string;
}) {
  const summary = await calculateCartSummary({
    userId,
    guestToken,
    couponCode: checkoutInput.couponCode,
    shippingMethod: checkoutInput.shippingMethod,
  });

  if (!summary.cart.items || summary.cart.items.length === 0) {
    throw new Error("Cannot place an order with an empty cart.");
  }

  // Generate unique order number (e.g. FF-1004)
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let nextNum = 1004;
  if (lastOrder && lastOrder.orderNumber.startsWith("FF-")) {
    const parsed = parseInt(lastOrder.orderNumber.replace("FF-", ""), 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  const orderNumber = `FF-${nextNum}`;

  // Execute order transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify and decrement stock
    for (const item of summary.cart.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { inventory: true },
      });

      if (!variant || variant.inventoryCount < item.quantity) {
        throw new Error(`Insufficient inventory for item: ${item.variant.product.name} (${item.variant.title})`);
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          inventoryCount: variant.inventoryCount - item.quantity,
        },
      });

      if (variant.inventory) {
        const newQty = Math.max(0, variant.inventory.quantity - item.quantity);
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: { quantity: newQty },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: variant.inventory.id,
            type: "ORDER_DEDUCTION",
            changeQuantity: -item.quantity,
            previousQuantity: variant.inventory.quantity,
            newQuantity: newQty,
            reason: `Order ${orderNumber} placed`,
          },
        });
      }
    }

    // 2. Increment coupon count if used
    if (summary.appliedCoupon) {
      await tx.coupon.update({
        where: { id: summary.appliedCoupon.id },
        data: { usedCount: summary.appliedCoupon.usedCount + 1 },
      });
    }

    // 3. Create Order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        status: "PROCESSING",
        subtotal: summary.subtotal,
        discountAmount: summary.discountAmount,
        shippingAmount: summary.shippingAmount,
        taxAmount: summary.taxAmount,
        totalAmount: summary.totalAmount,
        shippingAddressJson: JSON.stringify({
          fullName: checkoutInput.fullName,
          streetAddress: checkoutInput.streetAddress,
          apartment: checkoutInput.apartment,
          city: checkoutInput.city,
          state: checkoutInput.state,
          postalCode: checkoutInput.postalCode,
          country: checkoutInput.country,
          email: checkoutInput.email,
          phone: checkoutInput.phone,
        }),
        shippingMethod: checkoutInput.shippingMethod,
        couponId: summary.appliedCoupon ? summary.appliedCoupon.id : null,
        items: {
          create: summary.cart.items.map((item) => ({
            productId: item.variant.productId,
            variantId: item.variantId,
            title: `${item.variant.product.name} - ${item.variant.title}`,
            sku: item.variant.sku,
            price: item.variant.price,
            quantity: item.quantity,
            total: item.variant.price * item.quantity,
          })),
        },
        payments: {
          create: [
            {
              paymentMethod: checkoutInput.paymentMethod,
              transactionRef: `TXN-${Date.now()}-CONFIRMED`,
              status: "PAID",
              amount: summary.totalAmount,
            },
          ],
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // 4. Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId: summary.cart.id },
    });

    return newOrder;
  });

  return result;
}

export async function getOrderById(orderIdOrNumber: string) {
  return prisma.order.findFirst({
    where: {
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
      payments: true,
      user: true,
    },
  });
}
