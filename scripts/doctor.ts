import "dotenv/config";

const requiredFrontend = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const required = [
  ...requiredFrontend,
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "BREVO_API_KEY",
  "EMAIL_FROM",
];

const missing = required.filter((key) => !process.env[key] || process.env[key] === "");

if (missing.length) {
  console.error("Missing environment variables:");
  missing.forEach((key) => console.error(`- ${key}`));
  process.exit(1);
}

console.log("Environment looks complete.");
