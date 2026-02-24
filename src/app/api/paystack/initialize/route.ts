import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { orderId, email, amount } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json(
        { success: false, error: "orderId and email are required." },
        { status: 400 },
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Paystack secret key not configured." },
        { status: 500 }
      );
    }

    const orderRef = adminDb.collection("orders").doc(String(orderId));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const order = orderDoc.data() as {
      customer?: { email?: string };
      total?: number;
      payment?: { status?: string; reference?: string };
    };

    if ((order.payment?.status || "unpaid") === "paid") {
      return NextResponse.json(
        { success: false, error: "Order payment already completed." },
        { status: 400 },
      );
    }

    const orderEmail = String(order.customer?.email || "").toLowerCase();
    if (orderEmail && orderEmail !== String(email).toLowerCase()) {
      return NextResponse.json({ success: false, error: "Email does not match order." }, { status: 400 });
    }

    const expectedAmount = Number(order.total || 0);
    if (expectedAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid order total." }, { status: 400 });
    }
    if (amount !== undefined && Math.round(Number(amount)) !== Math.round(expectedAmount)) {
      return NextResponse.json(
        { success: false, error: "Amount does not match order total." },
        { status: 400 },
      );
    }

    const amountInKobo = Math.round(expectedAmount * 100);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: { orderId },
        callback_url: `${baseUrl}/checkout/verify`,
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ success: false, error: data.message }, { status: 400 });
    }

    await orderRef.update({
      "payment.reference": data.data.reference,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
