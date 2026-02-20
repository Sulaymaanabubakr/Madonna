import "dotenv/config";
import { adminDb } from "../src/lib/firebase/admin";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- user@email.com");
  process.exit(1);
}

async function run() {
  const users = await adminDb.collection("users").where("email", "==", email).limit(1).get();
  if (users.empty) {
    console.error("User with this email not found. Ask the user to sign up first.");
    process.exit(1);
  }

  const doc = users.docs[0];
  await doc.ref.set({ role: "admin" }, { merge: true });
  console.log(`Updated ${email} to admin`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
