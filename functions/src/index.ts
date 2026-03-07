import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import app from "./api/server";
import { sendStatusEmail } from "../../src/lib/email";

setGlobalOptions({ region: "europe-west1" });

export const api = onRequest(
    {
        secrets: [
            "PAYSTACK_SECRET_KEY",
            "PAYSTACK_PUBLIC_KEY",
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET",
            "BREVO_API_KEY",
            "EMAIL_FROM",
            "APP_URL",
            "CORS_ORIGINS"
        ],
    },
    app
);

export const onOrderStatusUpdated = onDocumentUpdated(
    {
        document: "orders/{orderId}",
        secrets: ["BREVO_API_KEY", "EMAIL_FROM", "APP_URL"]
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const beforeData = snapshot.before.data();
        const afterData = snapshot.after.data();

        const beforeStatus = beforeData.status;
        const afterStatus = afterData.status;

        if (beforeStatus !== afterStatus) {
            const customerEmail = afterData.customer?.email;
            const orderNumber = afterData.orderNumber || event.params.orderId;

            if (customerEmail) {
                await sendStatusEmail(customerEmail, orderNumber, afterStatus);
            }
        }
    }
);
