import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { BUSINESS } from "@/lib/constants";
import { requireAdmin } from "@/server/auth";

const defaultSettings = {
  storeName: BUSINESS.name,
  storeAddress: BUSINESS.address,
  phone: BUSINESS.phone,
  email: BUSINESS.email,
  whatsapp: BUSINESS.whatsapp,
  deliveryFee: 2000,
  updatedAt: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const docRef = adminDb.collection("settings").doc("store");
    const snap = await docRef.get();
    if (!snap.exists) {
      await docRef.set({ ...defaultSettings, updatedAtServer: FieldValue.serverTimestamp() });
      return NextResponse.json({ item: defaultSettings });
    }
    return NextResponse.json({ item: snap.data() });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    await adminDb.collection("settings").doc("store").set(
      {
        ...body,
        updatedAt: new Date().toISOString(),
        updatedAtServer: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
