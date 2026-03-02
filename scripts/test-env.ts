import * as dotenv from "dotenv";
import * as path from "path";

const loaded = dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("Dotenv loaded:", loaded.parsed ? "YES" : "NO");

async function test() {
  console.log("PROJECT ID FROM ENV:", process.env.FIREBASE_PROJECT_ID);
  const { adminDb } = await import("../src/lib/firebase/admin");
  console.log("Admin project:", adminDb.projectId);
}
test().catch(console.error);
