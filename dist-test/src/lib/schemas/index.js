"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusUpdateSchema = exports.checkoutSchema = exports.productSchema = exports.categorySchema = void 0;
var zod_1 = require("zod");
exports.categorySchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
exports.productSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10),
    price: zod_1.z.coerce.number().positive(),
    compareAtPrice: zod_1.z.coerce.number().optional(),
    categoryId: zod_1.z.string().min(1),
    categoryName: zod_1.z.string().min(1),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    featured: zod_1.z.boolean().default(false),
    bestSeller: zod_1.z.boolean().default(false),
    newArrival: zod_1.z.boolean().default(false),
    images: zod_1.z.array(zod_1.z.object({ publicId: zod_1.z.string(), url: zod_1.z.string().url(), alt: zod_1.z.string() })),
    stockQty: zod_1.z.coerce.number().int().nonnegative(),
    sku: zod_1.z.string().min(2),
    isActive: zod_1.z.boolean().default(true),
});
exports.checkoutSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    customer: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().min(7),
    }),
    shippingAddress: zod_1.z.object({
        fullName: zod_1.z.string().min(2),
        phone: zod_1.z.string().min(7),
        addressLine1: zod_1.z.string().min(5),
        city: zod_1.z.string().min(2),
        state: zod_1.z.string().min(2),
        notes: zod_1.z.string().optional(),
    }),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        productSlug: zod_1.z.string().optional(),
        name: zod_1.z.string(),
        price: zod_1.z.number(),
        qty: zod_1.z.number().int().positive(),
        imageUrl: zod_1.z.string().min(1),
        stockQty: zod_1.z.number().int().nonnegative(),
    })).min(1),
    subtotal: zod_1.z.number().nonnegative(),
    deliveryFee: zod_1.z.number().nonnegative(),
    total: zod_1.z.number().positive(),
});
exports.statusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
    ]),
    note: zod_1.z.string().optional(),
});
