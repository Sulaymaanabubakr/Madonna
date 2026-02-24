import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendOrderEmail } from "@/lib/email";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Paystack secret key not configured." },
        { status: 500 }
      );
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    const refQuery = await adminDb
      .collection("orders")
      .where("payment.reference", "==", reference)
      .limit(1)
      .get();

    if (refQuery.empty) {
      return NextResponse.json(
        { success: false, error: "No order found for payment reference" },
        { status: 404 },
      );
    }

    const orderDoc = refQuery.docs[0];
    const orderRef = orderDoc.ref;
    const orderId = orderDoc.id;

    const metadataOrderId = verifyData.data.metadata?.orderId;
    if (metadataOrderId && metadataOrderId !== orderId) {
      return NextResponse.json(
        { success: false, error: "Payment metadata does not match order reference" },
        { status: 400 },
      );
    }

    const orderData = orderDoc.data();
    const expectedKobo = Math.round(Number(orderData?.total || 0) * 100);
    const paidKobo = Number(verifyData.data.amount || 0);
    if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
      return NextResponse.json(
        { success: false, error: "Paid amount does not match order total" },
        { status: 400 },
      );
    }

    if (orderData?.status === "pending" && orderData?.payment?.status === "unpaid") {
      await orderRef.update({
        status: "confirmed",
        "payment.status": "paid",
        "payment.paidAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await orderRef.collection("statusEvents").add({
        status: "confirmed",
        note: "Payment verified successfully via Paystack",
        createdAt: new Date().toISOString(),
      });

      const customerEmail = String(orderData?.customer?.email || "");
      const orderNumber = String(orderData?.orderNumber || orderId);
      if (customerEmail) {
        await sendOrderEmail(customerEmail, orderNumber).catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
