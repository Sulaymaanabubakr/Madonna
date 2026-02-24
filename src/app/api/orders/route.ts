import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { checkoutSchema } from "@/lib/schemas";
import { createOrderNumber } from "@/server/order";
import type { CartItem, Order } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const productDocs = await Promise.all(
      data.items.map((item) => adminDb.collection("products").doc(item.productId).get()),
    );

    const validatedItems: CartItem[] = data.items.map((item, idx) => {
      const snap = productDocs[idx];
      if (!snap.exists) throw new Error(`Product not found: ${item.productId}`);

      const product = snap.data() as {
        name?: string;
        price?: number;
        stockQty?: number;
        isActive?: boolean;
        images?: Array<{ url?: string }>;
      };

      if (!product.isActive) throw new Error(`Product is inactive: ${item.productId}`);
      if (typeof product.stockQty !== "number" || item.qty > product.stockQty) {
        throw new Error(`Insufficient stock for: ${product.name || item.productId}`);
      }

      return {
        productId: item.productId,
        productSlug: item.productSlug,
        name: product.name || item.name,
        price: Number(product.price || 0),
        qty: item.qty,
        imageUrl: product.images?.[0]?.url || item.imageUrl,
        stockQty: Number(product.stockQty || item.stockQty),
      };
    });

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const settingsSnap = await adminDb.collection("settings").doc("store").get();
    const deliveryFee = Number(settingsSnap.data()?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    const orderRef = adminDb.collection("orders").doc();
    const now = new Date().toISOString();
    const orderNumber = createOrderNumber();

    const newOrder: Order = {
      id: orderRef.id,
      orderNumber,
      userId: data.userId,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      shippingAddress: {
        fullName: data.shippingAddress.fullName,
        phone: data.shippingAddress.phone,
        addressLine1: data.shippingAddress.addressLine1,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        notes: data.shippingAddress.notes,
      },
      payment: {
        provider: "paystack",
        reference: "",
        status: "unpaid",
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await orderRef.set(newOrder);
    await orderRef.collection("statusEvents").add({
      status: "pending",
      note: "Order created, waiting for payment",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      amount: total,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
