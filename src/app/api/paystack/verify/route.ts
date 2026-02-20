import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendOrderEmail } from "@/lib/email";
import { verifyPaystackPayment } from "@/lib/paystack";
import { checkoutSchema } from "@/lib/schemas";
import { createOrderNumber } from "@/server/order";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body;
    const parsed = checkoutSchema.safeParse(body.orderDraft);

    if (!reference || !parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const existing = await adminDb
      .collection("orders")
      .where("payment.reference", "==", reference)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, orderId: existing.docs[0].id });
    }

    const verify = await verifyPaystackPayment(reference);
    if (!verify.status || verify.data.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    const amountPaid = Number(verify.data.amount) / 100;
    if (Math.abs(amountPaid - parsed.data.total) > 1) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc();
    const now = new Date().toISOString();
    const order = {
      id: orderRef.id,
      orderNumber: createOrderNumber(),
      userId: parsed.data.userId || null,
      customer: parsed.data.customer,
      items: parsed.data.items,
      subtotal: parsed.data.subtotal,
      deliveryFee: parsed.data.deliveryFee,
      total: parsed.data.total,
      shippingAddress: parsed.data.shippingAddress,
      payment: {
        provider: "paystack",
        reference,
        status: "paid",
        paidAt: now,
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
      createdAtServer: FieldValue.serverTimestamp(),
      updatedAtServer: FieldValue.serverTimestamp(),
    };

    await orderRef.set(order);
    await orderRef.collection("statusEvents").add({
      status: "pending",
      note: "Order created after verified payment",
      createdAt: now,
      createdAtServer: FieldValue.serverTimestamp(),
    });

    await sendOrderEmail(parsed.data.customer.email, order.orderNumber);

    return NextResponse.json({ success: true, orderId: orderRef.id, orderNumber: order.orderNumber });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
