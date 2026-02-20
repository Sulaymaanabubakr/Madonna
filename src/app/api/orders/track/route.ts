import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const email = searchParams.get("email")?.toLowerCase();
  const phone = searchParams.get("phone");

  if (!orderId || (!email && !phone)) {
    return NextResponse.json({ error: "orderId and email or phone required" }, { status: 400 });
  }

  const orderDoc = await adminDb.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = orderDoc.data() as Record<string, any>;

  const emailMatch = email && String(order.customer?.email || "").toLowerCase() === email;
  const phoneMatch = phone && String(order.customer?.phone || "") === phone;

  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  const statusEventsSnap = await orderDoc.ref.collection("statusEvents").get();
  const statusEvents = statusEventsSnap.docs
    .map((doc) => doc.data())
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

  return NextResponse.json({
    order: {
      id: orderDoc.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
      total: order.total,
    },
    statusEvents,
  });
}
