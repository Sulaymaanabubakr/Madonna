import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromRequest } from "@/server/auth";

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getUserFromRequest(req);

    const doc = await adminDb.collection("orders").doc(params.orderId).get();
    if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const orderData = doc.data() as Record<string, unknown> & { userId?: string };
    const order = { id: doc.id, ...orderData };
    const orderUserId = String(orderData.userId || "");

    if (user.role !== "admin" && orderUserId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const eventsSnap = await adminDb
      .collection("orders")
      .doc(params.orderId)
      .collection("statusEvents")
      .get();

    const rawEvents = eventsSnap.docs.map((e) => ({
      id: e.id,
      ...(e.data() as Record<string, unknown>),
    }));

    const events = rawEvents.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ order, events });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
}
