import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().optional(),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  images: z.array(
    z.object({ publicId: z.string(), url: z.string().url(), alt: z.string() }),
  ),
  stockQty: z.coerce.number().int().nonnegative(),
  sku: z.string().min(2),
  isActive: z.boolean().default(true),
});

export const checkoutSchema = z.object({
  userId: z.string().optional(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
  }),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    addressLine1: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    notes: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      productSlug: z.string().optional(),
      name: z.string(),
      price: z.number(),
      qty: z.number().int().positive(),
      imageUrl: z.string().min(1),
      stockQty: z.number().int().nonnegative(),
    }),
  ).min(1),
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  total: z.number().positive(),
});

export const statusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().optional(),
});
