import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getDbClient } from "@/lib/firebase/client";
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import type { Order, OrderStatus } from "@/types";

export function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const db = await getDbClient();
            if (!db) return;
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
            setOrders(data);
        } catch (err: any) {
            toast.error("Failed to load orders: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const db = await getDbClient();
            if (!db) return;
            const orderRef = doc(db, "orders", orderId);

            await updateDoc(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
            await addDoc(collection(db, "orders", orderId, "statusEvents"), {
                status: newStatus,
                note: `Order status updated to ${newStatus} by admin`,
                createdAt: new Date().toISOString()
            });

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            toast.success("Order status updated!");
        } catch (err: any) {
            toast.error("Failed to update status: " + err.message);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pt-4 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground mt-2">Manage customer purchases and fulfillments.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>View all existing orders and manage their fulfillment status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1 w-full sm:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by Order # or Customer..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto w-full">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left font-medium text-muted-foreground [&>th]:p-4 [&>th]:align-middle whitespace-nowrap">
                                    <th>Order Number</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th className="w-[120px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr:last-child]:border-0 divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-muted-foreground py-8">
                                            Loading orders...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-muted-foreground py-8">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="transition-colors hover:bg-muted/50">
                                            <td className="p-4 font-mono font-medium">
                                                {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{order.customer?.name || order.shippingAddress?.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{order.customer?.phone || order.shippingAddress?.phone}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={order.payment?.status === "paid" ? "default" : "secondary"}>
                                                    {order.payment?.status?.toUpperCase() || "UNPAID"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(val: any) => updateOrderStatus(order.id, val)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="packed">Packed</SelectItem>
                                                        <SelectItem value="shipped">Shipped</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        <SelectItem value="refunded">Refunded</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-4 font-mono font-bold">
                                                ₦{order.total?.toLocaleString() || 0}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link to={`/admin/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
