const BRAND_COLOR = "#8B2030";

/** Parse "Name <email>" format into { name, email } */
function parseSender(from: string, storeName: string): { name: string; email: string } {
  // Strip any literal surrounding quotes that might have been saved in the secret
  const cleanFrom = from.replace(/^["']|["']$/g, "").trim();
  const match = cleanFrom.match(/<([^>]+)>/);
  if (match) {
    const email = match[1].trim();
    const namePart = cleanFrom.split("<")[0].trim();
    return { name: namePart || storeName, email };
  }
  return { name: storeName, email: cleanFrom };
}

export async function sendOrderEmail(to: string, orderNumber: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
  const EMAIL_FROM = process.env.EMAIL_FROM || "";
  const STORE_NAME = process.env.EMAIL_FROM_NAME || "Madonna Shopping Arena — Madonna Link Express Ventures";

  console.log("[sendOrderEmail] called:", { to, orderNumber });
  console.log("[sendOrderEmail] BREVO_API_KEY present:", !!BREVO_API_KEY, "length:", BREVO_API_KEY.length);
  console.log("[sendOrderEmail] EMAIL_FROM present:", !!EMAIL_FROM, "value:", EMAIL_FROM);

  if (!BREVO_API_KEY || !EMAIL_FROM) {
    console.log("[sendOrderEmail] SKIPPED — missing BREVO_API_KEY or EMAIL_FROM");
    return;
  }

  const sender = parseSender(EMAIL_FROM, STORE_NAME);
  console.log("[sendOrderEmail] sender:", sender);

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

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
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
    const resBody = await res.text();
    console.log("[sendOrderEmail] Brevo response:", res.status, resBody);
  } catch (err) {
    console.error("[sendOrderEmail] Brevo fetch error:", err);
  }
}

export async function sendStatusEmail(to: string, orderNumber: string, status: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
  const EMAIL_FROM = process.env.EMAIL_FROM || "";
  const STORE_NAME = process.env.EMAIL_FROM_NAME || "Madonna Shopping Arena — Madonna Link Express Ventures";

  console.log("[sendStatusEmail] called:", { to, orderNumber, status });

  if (!BREVO_API_KEY || !EMAIL_FROM) {
    console.log("[sendStatusEmail] SKIPPED — missing BREVO_API_KEY or EMAIL_FROM");
    return;
  }

  // Do not send emails for "pending" status, this is covered by the order confirmation email
  if (status === "pending" || status === "confirmed") return;

  const sender = parseSender(EMAIL_FROM, STORE_NAME);

  let title = "Order Update";
  let message = "Your order status has been updated.";
  
  switch (status.toLowerCase()) {
    case "packed":
      title = "Order Packed 📦";
      message = "Great news! Your items have been packed and are waiting for courier pickup.";
      break;
    case "shipped":
      title = "Order Shipped 🚚";
      message = "Your order is on the way! It has been handed over to our delivery partners.";
      break;
    case "delivered":
      title = "Order Delivered 🎉";
      message = "Your order has been successfully delivered. We hope you love your purchase!";
      break;
    case "cancelled":
      title = "Order Cancelled ❌";
      message = "Your order has been cancelled. If you have any questions, please contact our support.";
      break;
    case "refunded":
      title = "Order Refunded 💸";
      message = "Your payment has been refunded. It may take a few days for the funds to appear in your account.";
      break;
    default:
      title = `Order Status: ${status.toUpperCase()}`;
      message = `Your order status has changed to ${status}.`;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
                ${title}
              </h2>
              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                ${message}
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

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: to }],
        subject: `Order ${orderNumber} is now ${status.toUpperCase()} — ${STORE_NAME}`,
        htmlContent: html,
      }),
    });
    const resBody = await res.text();
    console.log("[sendStatusEmail] Brevo response:", res.status, resBody);
  } catch (err) {
    console.error("[sendStatusEmail] Brevo fetch error:", err);
  }
}

