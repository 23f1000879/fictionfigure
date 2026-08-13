import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive().default(1),
  guestToken: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().nonnegative(),
});

export const checkoutFormSchema = z.object({
  email: z.string().email("Valid email address is required"),
  phone: z.string().min(10, "Valid contact number required"),
  fullName: z.string().min(2, "Full name required"),
  streetAddress: z.string().min(3, "Street address required"),
  apartment: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(4, "Postal code required"),
  country: z.string().default("India"),
  shippingMethod: z.enum(["Standard Shipping", "Express Courier"]).default("Standard Shipping"),
  paymentMethod: z.enum(["CREDIT_CARD", "UPI", "RAZORPAY"]).default("CREDIT_CARD"),
  couponCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutFormSchema>;
