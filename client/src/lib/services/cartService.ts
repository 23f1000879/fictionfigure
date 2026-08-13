import { prisma } from "@/lib/db/prisma";

export async function getOrCreateCart(userId?: string, guestToken?: string) {
  if (userId) {
    let cart = await prisma.cart.findFirst({
      where: { userId },
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
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
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
        },
      });
    }

    return cart;
  }

  if (guestToken) {
    let cart = await prisma.cart.findFirst({
      where: { guestToken },
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
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { guestToken },
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
        },
      });
    }

    return cart;
  }

  throw new Error("Either userId or guestToken is required to access cart.");
}

export async function addItemToCart({
  variantId,
  quantity,
  userId,
  guestToken,
}: {
  variantId: string;
  quantity: number;
  userId?: string;
  guestToken?: string;
}) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) throw new Error("Product variant not found.");
  if (variant.inventoryCount < quantity) {
    throw new Error(`Only ${variant.inventoryCount} items available in stock.`);
  }

  const cart = await getOrCreateCart(userId, guestToken);

  const existingItem = cart.items.find((item) => item.variantId === variantId);

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > variant.inventoryCount) {
      throw new Error(`Cannot add more than ${variant.inventoryCount} items to cart.`);
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
      },
    });
  }

  return getOrCreateCart(userId, guestToken);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
  } else {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { variant: true },
    });
    if (!item) throw new Error("Cart item not found.");
    if (quantity > item.variant.inventoryCount) {
      throw new Error(`Only ${item.variant.inventoryCount} items in stock.`);
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
}

export async function removeCartItem(cartItemId: string) {
  await prisma.cartItem.delete({ where: { id: cartItemId } });
}
