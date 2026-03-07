const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "";

const BRAND_COLOR = "#8B2030";
const STORE_NAME = process.env.EMAIL_FROM_NAME || "Madonna Shopping Arena — Madonna Link Express Ventures";

/** Parse "Name <email>" format into { name, email } */
function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: STORE_NAME, email: from.trim() };
}

export async function sendOrderEmail(to: string, orderNumber: string) {
  if (!BREVO_API_KEY || !EMAIL_FROM) return;

  const sender = parseSender(EMAIL_FROM);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">
                ${STORE_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111111;font-size:20px;font-weight:700;">
                Order Confirmed ✓
              </h2>
              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                Thank you for your order! We've received your payment and are now
                getting your items ready.
              </p>
              <!-- Order number box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F4;border-left:4px solid ${BRAND_COLOR};margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999999;font-weight:700;">Order Number</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111111;">${orderNumber}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;color:#555555;font-size:14px;line-height:1.6;">
                You can track your order status at any time by visiting our website
                and clicking <strong>Track Order</strong>.
              </p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND_COLOR};">
                    <a href="${process.env.APP_URL || "https://madonnashoppingarena.com.ng"}/track"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;text-decoration:none;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#111111;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#777777;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: sender.name, email: sender.email },
      to: [{ email: to }],
      subject: `Order ${orderNumber} Confirmed — ${STORE_NAME}`,
      htmlContent: html,
    }),
  });
}
