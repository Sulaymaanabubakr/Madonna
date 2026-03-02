import { getDbClient } from "@/lib/firebase/client";
import { Category, Order, Product } from "@/types";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";

export async function fetchAdminDashboardStats() {
    const db = await getDbClient();
    if (!db) return null;

    try {
        // 1. Fetch Orders for stats
        // We fetch all orders here to calculate total sales etc.
        // In a massive production DB we'd use aggregations, but for this scale getDocs is okay.
        const ordersSnap = await getDocs(collection(db, "orders"));
        const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);

        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(o => o.status === "pending").length;

        // Total Sales: sum of 'total' where payment status is paid
        const totalSales = allOrders
            .filter(o => o.payment?.status === "paid" || o.status === "delivered")
            .reduce((sum, o) => sum + (o.total || 0), 0);

        // Recent Orders (last 10)
        const recentOrders = allOrders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        // 2. Fetch Low Stock Products
        // Products with stockQty <= 5
        const productsSnap = await getDocs(
            query(collection(db, "products"), where("stockQty", "<=", 5), limit(10))
        );
        const lowStockProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);

        // 3. Top Selling Products
        // For now we simulate top selling by finding bestSeller = true or just the first few products
        const topSellingSnap = await getDocs(
            query(collection(db, "products"), where("bestSeller", "==", true), limit(5))
        );
        const topSellingProducts = topSellingSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);

        return {
            totalOrders,
            pendingOrders,
            totalSales,
            recentOrders,
            lowStockProducts,
            topSellingProducts
        };
    } catch (err) {
        console.error("Error fetching admin stats:", err);
        return null;
    }
}

export async function fetchAdminProducts(): Promise<Product[]> {
    const db = await getDbClient();
    if (!db) return [];
    try {
        const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
    } catch (err) {
        console.error("Error fetching admin products:", err);
        return [];
    }
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
    const db = await getDbClient();
    if (!db) return false;
    try {
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "products", productId), { isActive: !currentStatus });
        return true;
    } catch (err) {
        console.error("Error toggling product status:", err);
        return false;
    }
}

export async function fetchAdminCategories(): Promise<Category[]> {
    const db = await getDbClient();
    if (!db) return [];
    try {
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "categories"));
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }) as Category)
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } catch (err) {
        console.error("Error fetching categories:", err);
        return [];
    }
}

export async function saveAdminCategory(category: Partial<Category>) {
    const db = await getDbClient();
    if (!db) return false;
    try {
        const { doc, setDoc, updateDoc, collection } = await import("firebase/firestore");
        if (category.id) {
            await updateDoc(doc(db, "categories", category.id), category);
        } else {
            const newDocRef = doc(collection(db, "categories"));
            await setDoc(newDocRef, {
                ...category,
                id: newDocRef.id,
                createdAt: new Date().toISOString()
            });
        }
        return true;
    } catch (err) {
        console.error("Error saving category:", err);
        return false;
    }
}

export async function deleteAdminCategory(categoryId: string) {
    const db = await getDbClient();
    if (!db) return false;
    try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "categories", categoryId));
        return true;
    } catch (err) {
        console.error("Error deleting category:", err);
        return false;
    }
}
