import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { statusUpdateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const orderRef = adminDb.collection("orders").doc(params.id);
    const now = new Date().toISOString();
    await orderRef.set(
      {
        status: parsed.data.status,
        updatedAt: now,
        updatedAtServer: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await orderRef.collection("statusEvents").add({
      status: parsed.data.status,
      note: parsed.data.note || "",
      createdAt: now,
      createdAtServer: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
