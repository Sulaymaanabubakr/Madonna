import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const usersSnap = await adminDb.collection("users").get();
    const ordersSnap = await adminDb.collection("orders").get();

    const orderCountByUser: Record<string, number> = {};
    ordersSnap.docs.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) orderCountByUser[userId] = (orderCountByUser[userId] || 0) + 1;
    });

    const items = usersSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
      orderCount: orderCountByUser[doc.id] || 0,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
