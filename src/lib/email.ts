import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOrderEmail(to: string, orderNumber: string) {
  if (!resend || !process.env.EMAIL_FROM) return;

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Order ${orderNumber} confirmed`,
    html: `<p>Your order <strong>${orderNumber}</strong> has been confirmed and is now being processed.</p>`,
  });
}
