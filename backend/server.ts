import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { adminDb } from "../src/lib/firebase/admin";
import { sendOrderEmail } from "../src/lib/email";
import { serializeProduct } from "../src/lib/product-serialization";
import { checkoutSchema } from "../src/lib/schemas";
import { defaultStoreSettings, serializeStoreSettings } from "../src/lib/settings-serialization";
import type { CartItem, Order } from "../src/types";
import { getUserFromRequest, requireAdmin, verifyTokenFromRequest } from "./auth";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function createOrderNumber() {
  return `MLX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (req, res) => {
  try {
    const q = String(req.query.q || "").toLowerCase();
    const category = String(req.query.category || "");
    const slug = String(req.query.slug || "");
    const sort = String(req.query.sort || "new");
    const page = Number(req.query.page || "1");
    const pageSize = Number(req.query.pageSize || "12");

    const snapshot = await adminDb.collection("products").where("isActive", "==", true).get();
    let products = snapshot.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));

    if (slug) products = products.filter((p) => p.slug === slug);

    if (q) {
      products = products.filter((p) =>
        `${p.name ?? ""} ${p.description ?? ""} ${p.tags?.join(" ") ?? ""}`.toLowerCase().includes(q),
      );
    }

    if (category) {
      products = products.filter((p) => p.categoryId === category || p.categoryName === category || p.slug === category);
    }

    products = products.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      if (sort === "best") return Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller));
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 12;
    const total = products.length;
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    res.json({
      items: products.slice(start, end),
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/contact", publicWriteLimiter, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required" });
      return;
    }

    await adminDb.collection("contactMessages").add({
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/newsletter", publicWriteLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }

    await adminDb.collection("newsletterSubscribers").doc(email).set(
      {
        email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const data = parsed.data;

    const productDocs = await Promise.all(
      data.items.map((item) => adminDb.collection("products").doc(item.productId).get()),
    );

    const validatedItems: CartItem[] = data.items.map((item, idx) => {
      const snap = productDocs[idx];
      if (!snap.exists) throw new Error(`Product not found: ${item.productId}`);

      const product = snap.data() as {
        name?: string;
        price?: number;
        stockQty?: number;
        isActive?: boolean;
        images?: Array<{ url?: string }>;
      };

      if (!product.isActive) throw new Error(`Product is inactive: ${item.productId}`);
      if (typeof product.stockQty !== "number" || item.qty > product.stockQty) {
        throw new Error(`Insufficient stock for: ${product.name || item.productId}`);
      }

      return {
        productId: item.productId,
        productSlug: item.productSlug,
        name: product.name || item.name,
        price: Number(product.price || 0),
        qty: item.qty,
        imageUrl: product.images?.[0]?.url || item.imageUrl,
        stockQty: Number(product.stockQty || item.stockQty),
      };
    });

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const settingsSnap = await adminDb.collection("settings").doc("store").get();
    const deliveryFee = Number(settingsSnap.data()?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    const orderRef = adminDb.collection("orders").doc();
    const now = new Date().toISOString();
    const orderNumber = createOrderNumber();

    const newOrder: Order = {
      id: orderRef.id,
      orderNumber,
      userId: data.userId,
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

    await orderRef.set(newOrder);
    await orderRef.collection("statusEvents").add({
      status: "pending",
      note: "Order created, waiting for payment",
      createdAt: now,
    });

    res.json({ success: true, orderId: orderRef.id, orderNumber, amount: total });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get("/api/orders/me", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const snapshot = await adminDb.collection("orders").where("userId", "==", user.uid).get();

    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .sort((a, b) => {
        const timeA = new Date(String((a as Record<string, unknown>).createdAt || 0)).getTime();
        const timeB = new Date(String((b as Record<string, unknown>).createdAt || 0)).getTime();
        return timeB - timeA;
      });

    res.json({ items });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

app.get("/api/orders/id/:orderId", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    const orderId = String(req.params.orderId || "");
    const doc = await adminDb.collection("orders").doc(orderId).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const orderData = doc.data() as Record<string, unknown> & { userId?: string };
    const order = { id: doc.id, ...orderData };
    const orderUserId = String(orderData.userId || "");

    if (user.role !== "admin" && orderUserId !== user.uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const eventsSnap = await adminDb.collection("orders").doc(orderId).collection("statusEvents").get();
    const events = eventsSnap.docs
      .map((e) => ({ id: e.id, ...(e.data() as Record<string, unknown>) }))
      .sort(
        (a, b) =>
          new Date(String((b as Record<string, unknown>).createdAt || 0)).getTime() -
          new Date(String((a as Record<string, unknown>).createdAt || 0)).getTime(),
      );

    res.json({ order, events });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

app.get("/api/orders/track", publicWriteLimiter, async (req, res) => {
  try {
    const orderId = String(req.query.orderId || "");
    const email = String(req.query.email || "").toLowerCase();
    const phone = String(req.query.phone || "");

    if (!orderId || (!email && !phone)) {
      res.status(400).json({ error: "orderId and email or phone required" });
      return;
    }

    const orderDoc = await adminDb.collection("orders").doc(orderId).get();
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

    const orderRef = adminDb.collection("orders").doc(String(orderId));
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

app.post("/api/paystack/verify", async (req, res) => {
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
    if (!verifyData.status || verifyData.data.status !== "success") {
      res.status(400).json({ success: false, error: "Payment verification failed" });
      return;
    }

    const refQuery = await adminDb.collection("orders").where("payment.reference", "==", reference).limit(1).get();
    if (refQuery.empty) {
      res.status(404).json({ success: false, error: "No order found for payment reference" });
      return;
    }

    const orderDoc = refQuery.docs[0];
    const orderRef = orderDoc.ref;
    const orderId = orderDoc.id;
    const orderData = orderDoc.data() as Record<string, unknown>;

    const metadataOrderId = verifyData.data.metadata?.orderId;
    if (metadataOrderId && metadataOrderId !== orderId) {
      res.status(400).json({ success: false, error: "Payment metadata does not match order reference" });
      return;
    }

    const expectedKobo = Math.round(Number(orderData.total || 0) * 100);
    const paidKobo = Number(verifyData.data.amount || 0);
    if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
      res.status(400).json({ success: false, error: "Paid amount does not match order total" });
      return;
    }

    if (orderData.status === "pending" && (orderData.payment as { status?: string } | undefined)?.status === "unpaid") {
      await orderRef.update({
        status: "confirmed",
        "payment.status": "paid",
        "payment.paidAt": new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await orderRef.collection("statusEvents").add({
        status: "confirmed",
        note: "Payment verified successfully via Paystack",
        createdAt: new Date().toISOString(),
      });

      const customerEmail = String(((orderData.customer as Record<string, unknown> | undefined)?.email) || "");
      const orderNumber = String(orderData.orderNumber || orderId);
      if (customerEmail) await sendOrderEmail(customerEmail, orderNumber).catch(() => undefined);
    }

    res.json({ success: true, orderId });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get("/api/settings/public", async (_req, res) => {
  try {
    const snap = await adminDb.collection("settings").doc("store").get();
    const settings = snap.exists
      ? serializeStoreSettings(snap.data() as Record<string, unknown>)
      : defaultStoreSettings;

    res.json({
      item: {
        storeName: settings.storeName,
        phone: settings.phone,
        announcementEnabled: settings.announcementEnabled,
        announcementText: settings.announcementText,
        announcementSpeed: settings.announcementSpeed,
      },
    });
  } catch {
    res.json({
      item: {
        storeName: defaultStoreSettings.storeName,
        phone: defaultStoreSettings.phone,
        announcementEnabled: defaultStoreSettings.announcementEnabled,
        announcementText: defaultStoreSettings.announcementText,
        announcementSpeed: defaultStoreSettings.announcementSpeed,
      },
    });
  }
});

app.get("/api/me", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    res.json({ profile: user });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

app.post("/api/users/profile", async (req, res) => {
  try {
    const decoded = await verifyTokenFromRequest(req);
    const name = String(req.body?.name || decoded.name || decoded.email?.split("@")[0] || "Customer");
    const email = String(req.body?.email || decoded.email || "");
    const existing = await adminDb.collection("users").doc(decoded.uid).get();
    const role = String((existing.data() as Record<string, unknown> | undefined)?.role || "customer");

    await adminDb.collection("users").doc(decoded.uid).set(
      {
        uid: decoded.uid,
        name,
        email,
        role,
        createdAt: String((existing.data() as Record<string, unknown> | undefined)?.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/settings", async (req, res) => {
  try {
    await requireAdmin(req);
    const docRef = adminDb.collection("settings").doc("store");
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
    await adminDb.collection("settings").doc("store").set(
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

app.get("/api/admin/orders", async (req, res) => {
  try {
    await requireAdmin(req);
    const snapshot = await adminDb.collection("orders").get();
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
    const snapshot = await adminDb.collection("products").get();
    const items = snapshot.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));
    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
