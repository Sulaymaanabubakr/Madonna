import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Support both standalone start (cwd is root) and Firebase Emulator start (cwd is functions)
const envPath = process.cwd().endsWith("functions")
  ? path.resolve(process.cwd(), "../.env")
  : path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { getAdminDb, getAdminAuth } from "../src/lib/firebase/admin";
import { sendOrderEmail } from "../src/lib/email";
import { checkoutSchema } from "../src/lib/schemas";
import type { CartItem, Order } from "../src/types";
import { getUserFromRequest, requireAdmin } from "./auth";
import cloudinary from "../src/lib/cloudinary";
import { serializeProduct } from "../src/lib/product-serialization";
import { serializeStoreSettings, defaultStoreSettings } from "../src/lib/settings-serialization";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const allowedOrigins = [
  ...(process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  "http://localhost:3000",
  "http://localhost:5173",
];

// Returns true for any origin that is explicitly allowed or is a Vercel preview deployment.
function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel preview deployments (*.vercel.app)
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {
    // ignore malformed origins
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

function rateLimitJsonHandler(req: Request, res: Response) {
  res.status(429).json({
    success: false,
    error: "Too many requests. Please wait a few minutes and try again.",
    path: req.path,
  });
}

const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

const paymentVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

function createOrderNumber() {
  return `MLX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/orders", publicWriteLimiter, async (req, res) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      const fieldEntries = Object.entries(flattened.fieldErrors)
        .map(([field, messages]) => {
          const first = Array.isArray(messages) ? messages[0] : undefined;
          return first ? `${field}: ${first}` : "";
        })
        .filter(Boolean);
      const formMessage = flattened.formErrors[0] || "";
      const message = [formMessage, ...fieldEntries].filter(Boolean).join(" | ") || "Invalid checkout payload";
      res.status(400).json({ success: false, error: message, details: flattened });
      return;
    }

    const data = parsed.data;
    let authenticatedUserId: string | undefined;
    try {
      const requester = await getUserFromRequest(req);
      authenticatedUserId = requester.uid;
    } catch {
      authenticatedUserId = undefined;
    }

    const productSnapshots = await Promise.all(
      data.items.map(async (item) => {
        const byId = await getAdminDb().collection("products").doc(item.productId).get();
        if (byId.exists) return byId;
        const slug = String(item.productSlug || "").trim();
        if (slug) {
          const bySlug = await getAdminDb().collection("products").where("slug", "==", slug).limit(1).get();
          if (!bySlug.empty) return bySlug.docs[0];
        }

        // Last-resort migration fallback for legacy carts after reseeding IDs/slugs.
        const name = String(item.name || "").trim();
        if (name) {
          const byName = await getAdminDb().collection("products").where("name", "==", name).limit(1).get();
          if (!byName.empty) return byName.docs[0];
        }
        return byId;
      }),
    );

    const validatedItems: CartItem[] = [];
    const missingProductIds: string[] = [];
    const inactiveProductIds: string[] = [];
    const insufficientStockItems: Array<{ productId: string; requestedQty: number; availableQty: number }> = [];

    data.items.forEach((item, idx) => {
      const snap = productSnapshots[idx];
      if (!snap.exists) {
        missingProductIds.push(item.productId);
        return;
      }

      const product = snap.data() as {
        name?: string;
        price?: number;
        stockQty?: number;
        isActive?: boolean;
        images?: Array<{ url?: string }>;
      };

      if (!product.isActive) {
        inactiveProductIds.push(item.productId);
        return;
      }
      const liveStock = typeof product.stockQty === "number" ? product.stockQty : 0;
      if (item.qty > liveStock) {
        insufficientStockItems.push({
          productId: item.productId,
          requestedQty: item.qty,
          availableQty: liveStock,
        });
        if (liveStock < 1) return;
        validatedItems.push({
          productId: item.productId,
          productSlug: item.productSlug,
          name: product.name || item.name,
          price: Number(product.price || 0),
          qty: liveStock,
          imageUrl: product.images?.[0]?.url || item.imageUrl,
          stockQty: Number(product.stockQty || item.stockQty),
        });
        return;
      }

      validatedItems.push({
        productId: item.productId,
        productSlug: item.productSlug,
        name: product.name || item.name,
        price: Number(product.price || 0),
        qty: item.qty,
        imageUrl: product.images?.[0]?.url || item.imageUrl,
        stockQty: Number(product.stockQty || item.stockQty),
      });
    });

    if (validatedItems.length === 0 && (missingProductIds.length || inactiveProductIds.length || insufficientStockItems.length)) {
      res.status(409).json({
        success: false,
        code: "CART_OUTDATED",
        error: "Some products in your cart are no longer available or have changed stock.",
        details: {
          missingProductIds,
          inactiveProductIds,
          insufficientStockItems,
        },
      });
      return;
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const settingsSnap = await getAdminDb().collection("settings").doc("store").get();
    const deliveryFee = Number(settingsSnap.data()?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    const orderRef = getAdminDb().collection("orders").doc();
    const now = new Date().toISOString();
    const orderNumber = createOrderNumber();

    const newOrder: Order = {
      id: orderRef.id,
      orderNumber,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      shippingAddress: {
        fullName: data.shippingAddress.fullName,
        phone: data.shippingAddress.phone,
        addressLine1: data.shippingAddress.addressLine1,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        notes: data.shippingAddress.notes,
      },
      payment: {
        provider: "paystack",
        reference: "",
        status: "unpaid",
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    if (authenticatedUserId) {
      newOrder.userId = authenticatedUserId;
    }

    const sanitizedOrder = JSON.parse(JSON.stringify(newOrder)) as Order;
    await orderRef.set(sanitizedOrder);
    await orderRef.collection("statusEvents").add({
      status: "pending",
      note: "Order created, waiting for payment",
      createdAt: now,
    });

    res.json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      amount: total,
      adjustments: {
        missingProductIds,
        inactiveProductIds,
        insufficientStockItems,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    console.error("[/api/orders] checkout error:", error);
    const statusCode = message.startsWith("Product") || message.startsWith("Insufficient stock") ? 400 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

app.get("/api/orders/track", publicWriteLimiter, async (req, res) => {
  try {
    const orderIdOrNumber = String(req.query.orderId || req.query.orderNumber || "").trim();
    const email = String(req.query.email || "").toLowerCase();
    const phone = String(req.query.phone || "");

    if (!orderIdOrNumber || (!email && !phone)) {
      res.status(400).json({ error: "orderId/orderNumber and email or phone required" });
      return;
    }

    let orderDoc = await getAdminDb().collection("orders").doc(orderIdOrNumber).get();
    if (!orderDoc.exists) {
      const orderNumberQuery = await getAdminDb()
        .collection("orders")
        .where("orderNumber", "==", orderIdOrNumber)
        .limit(1)
        .get();
      if (!orderNumberQuery.empty) {
        orderDoc = orderNumberQuery.docs[0];
      }
    }

    if (!orderDoc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orderDoc.data() as Record<string, unknown>;
    const customer = (order.customer || {}) as Record<string, unknown>;
    const emailMatch = email && String(customer.email || "").toLowerCase() === email;
    const phoneMatch = phone && String(customer.phone || "") === phone;

    if (!emailMatch && !phoneMatch) {
      res.status(403).json({ error: "Verification failed" });
      return;
    }

    const statusEventsSnap = await orderDoc.ref.collection("statusEvents").get();
    const statusEvents = statusEventsSnap.docs
      .map((doc) => doc.data())
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

    res.json({
      order: {
        id: orderDoc.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
        total: order.total,
      },
      statusEvents,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { orderId, email, amount } = req.body as { orderId?: string; email?: string; amount?: number };
    if (!orderId || !email) {
      res.status(400).json({ success: false, error: "orderId and email are required." });
      return;
    }

    if (!PAYSTACK_SECRET_KEY) {
      res.status(500).json({ success: false, error: "Paystack secret key not configured." });
      return;
    }

    const orderRef = getAdminDb().collection("orders").doc(String(orderId));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    const order = orderDoc.data() as {
      customer?: { email?: string };
      total?: number;
      payment?: { status?: string };
    };

    if ((order.payment?.status || "unpaid") === "paid") {
      res.status(400).json({ success: false, error: "Order payment already completed." });
      return;
    }

    const orderEmail = String(order.customer?.email || "").toLowerCase();
    if (orderEmail && orderEmail !== String(email).toLowerCase()) {
      res.status(400).json({ success: false, error: "Email does not match order." });
      return;
    }

    const expectedAmount = Number(order.total || 0);
    if (expectedAmount <= 0) {
      res.status(400).json({ success: false, error: "Invalid order total." });
      return;
    }

    if (amount !== undefined && Math.round(Number(amount)) !== Math.round(expectedAmount)) {
      res.status(400).json({ success: false, error: "Amount does not match order total." });
      return;
    }

    const amountInKobo = Math.round(expectedAmount * 100);
    const baseUrl = process.env.APP_URL || allowedOrigins[0] || "http://localhost:3000";

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: { orderId },
        callback_url: `${baseUrl}/checkout/verify`,
      }),
    });

    const data = await paystackRes.json();
    if (!data.status) {
      res.status(400).json({ success: false, error: data.message });
      return;
    }

    await orderRef.update({
      "payment.reference": data.data.reference,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post("/api/paystack/verify", paymentVerifyLimiter, async (req, res) => {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) {
      res.status(400).json({ success: false, error: "Missing reference" });
      return;
    }

    if (!PAYSTACK_SECRET_KEY) {
      res.status(500).json({ success: false, error: "Paystack secret key not configured." });
      return;
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const verifyData = await verifyRes.json();
    const verifyStatus = Boolean(verifyData?.status);
    const paymentStatus = String(verifyData?.data?.status || "");
    if (!verifyStatus || paymentStatus !== "success") {
      res.status(400).json({ success: false, error: "Payment verification failed" });
      return;
    }

    const refQuery = await getAdminDb().collection("orders").where("payment.reference", "==", reference).limit(1).get();
    if (refQuery.empty) {
      res.status(404).json({ success: false, error: "No order found for payment reference" });
      return;
    }

    const orderDoc = refQuery.docs[0];
    const orderRef = orderDoc.ref;
    const orderId = orderDoc.id;
    const orderData = orderDoc.data() as Record<string, unknown>;

    const metadataOrderId = verifyData?.data?.metadata?.orderId;
    if (metadataOrderId && metadataOrderId !== orderId) {
      res.status(400).json({ success: false, error: "Payment metadata does not match order reference" });
      return;
    }

    const expectedKobo = Math.round(Number(orderData.total || 0) * 100);
    const paidKobo = Number(verifyData?.data?.amount || 0);
    if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
      res.status(400).json({ success: false, error: "Paid amount does not match order total" });
      return;
    }

    let paymentTransitioned = false;
    await getAdminDb().runTransaction(async (tx) => {
      const latestOrderDoc = await tx.get(orderRef);
      if (!latestOrderDoc.exists) throw new Error("Order no longer exists");

      const latestOrder = latestOrderDoc.data() as Record<string, unknown>;
      const latestPayment = (latestOrder.payment as { status?: string } | undefined)?.status || "unpaid";
      const latestStatus = String(latestOrder.status || "");
      if (latestPayment === "paid") return;

      if (!(latestStatus === "pending" && latestPayment === "unpaid")) {
        throw new Error("Order is not payable in its current status");
      }

      const items = Array.isArray(latestOrder.items)
        ? (latestOrder.items as Array<{ productId?: string; qty?: number }>)
        : [];

      for (const item of items) {
        const productId = String(item.productId || "");
        const qty = Math.floor(Number(item.qty || 0));
        if (!productId || qty < 1) throw new Error("Invalid order item while confirming payment");

        const productRef = getAdminDb().collection("products").doc(productId);
        const productDoc = await tx.get(productRef);
        if (!productDoc.exists) throw new Error(`Product no longer exists: ${productId}`);

        const product = productDoc.data() as { stockQty?: number; name?: string };
        const currentStock = Number(product.stockQty || 0);
        if (!Number.isFinite(currentStock) || currentStock < qty) {
          throw new Error(`Insufficient stock for: ${product.name || productId}`);
        }

        tx.update(productRef, {
          stockQty: currentStock - qty,
          updatedAt: new Date().toISOString(),
        });
      }

      const now = new Date().toISOString();
      tx.update(orderRef, {
        status: "confirmed",
        "payment.status": "paid",
        "payment.paidAt": now,
        updatedAt: now,
      });
      tx.set(orderRef.collection("statusEvents").doc(), {
        status: "confirmed",
        note: "Payment verified successfully via Paystack",
        createdAt: now,
      });
      paymentTransitioned = true;
    });

    if (paymentTransitioned) {
      const customerEmail = String(((orderData.customer as Record<string, unknown> | undefined)?.email) || "");
      const orderNumber = String(orderData.orderNumber || orderId);
      if (customerEmail) await sendOrderEmail(customerEmail, orderNumber).catch(() => undefined);
    }

    res.json({ success: true, orderId });
  } catch (error) {
    const message = (error as Error).message;
    console.error("[/api/paystack/verify] verify error:", error);
    const statusCode =
      message.includes("Insufficient stock") ||
        message.includes("Product no longer exists") ||
        message.includes("Order no longer exists") ||
        message.includes("Order is not payable") ||
        message.includes("Invalid order item")
        ? 409
        : 500;
    res.status(statusCode).json({
      success: false,
      error: message || "Payment verification failed due to an unexpected server error.",
    });
  }
});

// Debug endpoint to check Vercel production health and Firebase initialization
app.get("/api/health", (req, res) => {
  try {
    const adminAuthCheck = !!getAdminAuth();
    const adminDbCheck = !!getAdminDb();

    res.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      firebase: {
        authInitialized: adminAuthCheck,
        dbInitialized: adminDbCheck,
        projectIdPresent: !!process.env.FIREBASE_PROJECT_ID,
        clientEmailPresent: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyLength: (process.env.FIREBASE_PRIVATE_KEY || "").length,
      },
      paystackKeyPresent: !!PAYSTACK_SECRET_KEY,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: String(error),
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

app.get("/api/admin/settings", async (req, res) => {
  try {
    await requireAdmin(req);
    const docRef = getAdminDb().collection("settings").doc("store");
    const snap = await docRef.get();
    if (!snap.exists) {
      await docRef.set({ ...defaultStoreSettings });
      res.json({ item: defaultStoreSettings });
      return;
    }

    res.json({ item: serializeStoreSettings(snap.data() as Record<string, unknown>) });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    await requireAdmin(req);
    const serialized = serializeStoreSettings(req.body as Record<string, unknown>);
    await getAdminDb().collection("settings").doc("store").set(
      {
        ...serialized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/upload", async (req, res) => {
  try {
    await requireAdmin(req);
    const { image } = req.body as { image?: string };
    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }
    const result = await cloudinary.uploader.upload(image, { folder: "madonna_products" });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    await requireAdmin(req);
    const snapshot = await getAdminDb().collection("orders").get();
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .sort(
        (a, b) =>
          new Date(String((b as Record<string, unknown>).createdAt || 0)).getTime() -
          new Date(String((a as Record<string, unknown>).createdAt || 0)).getTime(),
      );
    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/products", async (req, res) => {
  try {
    await requireAdmin(req);
    const snapshot = await getAdminDb().collection("products").get();
    const items = snapshot.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));
    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

export default app;
