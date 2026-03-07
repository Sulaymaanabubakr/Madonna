import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import app from "./api/server";

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
