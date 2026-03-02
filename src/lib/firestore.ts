/**
 * Client-side Firestore service.
 * All public data reads and user-owned reads/writes go here —
 * no API server round-trip required.
 */

import { getDbClient } from "@/lib/firebase/client";
import { serializeProduct } from "@/lib/product-serialization";
import { serializeStoreSettings, defaultStoreSettings } from "@/lib/settings-serialization";
import type { Order, Product, StatusEvent, StoreSettings, UserProfile } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
    q?: string;
    category?: string;
    slug?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
}

export interface ProductsResult {
    items: Product[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
    const db = await getDbClient();
    if (!db) return { items: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 } };

    const { collection, getDocs, query, where } = await import("firebase/firestore");

    // The seed script uses boolean `true`, not string `"true"`.
    const q_fs = query(collection(db, "products"), where("isActive", "==", true));
    const snapshot = await getDocs(q_fs);

    let products = snapshot.docs.map((doc) =>
        serializeProduct(doc.id, doc.data() as Record<string, unknown>),
    );

    const { q = "", category = "", slug = "", sort = "new", page = 1, pageSize = 12 } = filters;

    if (slug) products = products.filter((p) => p.slug === slug);

    if (q) {
        const lower = q.toLowerCase();
        products = products.filter((p) =>
            `${p.name ?? ""} ${p.description ?? ""} ${p.tags?.join(" ") ?? ""}`.toLowerCase().includes(lower),
        );
    }

    if (category && category !== "all") {
        products = products.filter(
            (p) => p.categoryId === category || p.categoryName === category || p.slug === category,
        );
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

    return {
        items: products.slice(start, start + safePageSize),
        pagination: {
            page: safePage,
            pageSize: safePageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / safePageSize)),
        },
    };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fetchPublicSettings(): Promise<StoreSettings> {
    const db = await getDbClient();
    if (!db) return defaultStoreSettings;

    try {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "settings", "store"));
        return snap.exists()
            ? serializeStoreSettings(snap.data() as Record<string, unknown>)
            : defaultStoreSettings;
    } catch {
        return defaultStoreSettings;
    }
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
    const db = await getDbClient();
    if (!db) return null;

    try {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) return null;
        return snap.data() as UserProfile;
    } catch {
        return null;
    }
}

export async function saveUserProfile(
    uid: string,
    data: { name: string; email: string; role?: string; createdAt?: string },
): Promise<void> {
    const db = await getDbClient();
    if (!db) return;

    const { doc, setDoc, getDoc, serverTimestamp } = await import("firebase/firestore");
    const ref = doc(db, "users", uid);
    const existing = await getDoc(ref);
    const existingData = existing.data() as Record<string, unknown> | undefined;

    await setDoc(
        ref,
        {
            uid,
            name: data.name,
            email: data.email,
            role: existingData?.role ?? data.role ?? "customer",
            createdAt: existingData?.createdAt ?? data.createdAt ?? new Date().toISOString(),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
}

// ─── Orders (read) ────────────────────────────────────────────────────────────

export async function fetchMyOrders(uid: string): Promise<Order[]> {
    const db = await getDbClient();
    if (!db) return [];

    try {
        const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
        const q_fs = query(
            collection(db, "orders"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc"),
        );
        const snapshot = await getDocs(q_fs);
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Order));
    } catch {
        return [];
    }
}

export async function fetchOrderById(
    orderId: string,
): Promise<{ order: Order; events: StatusEvent[] } | null> {
    const db = await getDbClient();
    if (!db) return null;

    try {
        const { collection, doc, getDoc, getDocs, orderBy, query } = await import("firebase/firestore");
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        if (!orderSnap.exists()) return null;

        const order = { id: orderSnap.id, ...(orderSnap.data() as Record<string, unknown>) } as Order;

        const eventsSnap = await getDocs(
            query(collection(db, "orders", orderId, "statusEvents"), orderBy("createdAt", "asc")),
        );
        const events = eventsSnap.docs.map(
            (e) => ({ id: e.id, ...(e.data() as Record<string, unknown>) } as unknown as StatusEvent),
        );

        return { order, events };
    } catch {
        return null;
    }
}

// ─── Contact / Newsletter ─────────────────────────────────────────────────────

export async function submitContactForm(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
}): Promise<void> {
    const db = await getDbClient();
    if (!db) throw new Error("Firebase not configured");

    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "contactMessages"), {
        ...data,
        createdAt: new Date().toISOString(),
    });
}

export async function subscribeNewsletter(email: string): Promise<void> {
    const db = await getDbClient();
    if (!db) throw new Error("Firebase not configured");

    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(
        doc(db, "newsletterSubscribers", email),
        { email, updatedAt: new Date().toISOString() },
        { merge: true },
    );
}
