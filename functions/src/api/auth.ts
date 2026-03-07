import type { Request } from "express";
import { getAdminAuth, getAdminDb } from "../../../src/lib/firebase/admin";

export async function verifyTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) throw new Error("Missing auth token");

  return getAdminAuth().verifyIdToken(token);
}

export async function getUserFromRequest(req: Request) {
  const decoded = await verifyTokenFromRequest(req);
  const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
  if (!userDoc.exists) {
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      role: "customer",
    };
  }

  return {
    uid: decoded.uid,
    ...(userDoc.data() as { role?: string; email?: string; name?: string }),
  };
}

export async function requireAdmin(req: Request) {
  const user = await getUserFromRequest(req);
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}
