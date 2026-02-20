import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUserFromRequest } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const snap = await adminDb.collection("orders").where("userId", "==", user.uid).get();
    const orders: Array<Record<string, unknown>> = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
    orders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return NextResponse.json({ items: orders });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
