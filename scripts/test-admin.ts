import "dotenv/config";
import { getAdminDb, getAdminAuth } from "../src/lib/firebase/admin";

async function test() {
    try {
        console.log("Testing Admin Db Initialization...");
        const db = getAdminDb();
        console.log("Db instances fetched, attempting to read products...");
        const snapshot = await db.collection("products").limit(1).get();
        console.log(`Success! Found ${snapshot.size} products.`);
        process.exit(0);
    } catch (error) {
        console.error("Firebase Admin Error:", error);
        process.exit(1);
    }
}

test();
