import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) throw new Error("Missing auth token");

  const decoded = await adminAuth.verifyIdToken(token);
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();

  if (!userDoc.exists) throw new Error("User profile not found");

  return {
    uid: decoded.uid,
    ...(userDoc.data() as { role?: string; email?: string; name?: string }),
  };
}

export async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
