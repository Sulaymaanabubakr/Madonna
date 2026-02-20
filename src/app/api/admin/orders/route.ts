import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.toLowerCase() || "";

    const snap = await adminDb.collection("orders").get();
    let items: Array<Record<string, unknown>> = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    if (status) items = items.filter((i) => i.status === status);
    if (query) {
      items = items.filter((i) =>
        `${i.orderNumber || ""} ${(i.customer as { name?: string; email?: string })?.name || ""} ${(i.customer as { name?: string; email?: string })?.email || ""}`
          .toLowerCase()
          .includes(query),
      );
    }

    items = items.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
