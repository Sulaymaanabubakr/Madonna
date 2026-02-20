import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { initializePaystackPayment } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body.orderDraft);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const reference = `MADONNA_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout?reference=${reference}`;

    const payload = await initializePaystackPayment({
      email: parsed.data.customer.email,
      amount: Math.round(parsed.data.total * 100),
      reference,
      callback_url: callbackUrl,
      metadata: {
        custom_fields: [{ display_name: "Phone", variable_name: "phone", value: parsed.data.customer.phone }],
      },
    });

    return NextResponse.json({ reference, payload: payload.data, orderDraft: parsed.data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
