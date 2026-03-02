import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Package, User, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchOrderById } from "@/lib/firestore";
import { getDbClient } from "@/lib/firebase/client";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import type { Order, StatusEvent, OrderStatus } from "@/types";

export function AdminOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [events, setEvents] = useState<StatusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalNote, setInternalNote] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadOrderData = async () => {
        if (!id) return;
        setLoading(true);
        const data = await fetchOrderById(id);
        if (data) {
            setOrder(data.order);
            setEvents(data.events);
        } else {
            toast.error("Order not found");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadOrderData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!id || !order) return;
        setUpdatingStatus(true);
        try {
            const db = await getDbClient();
            if (!db) return;

            await updateDoc(doc(db, "orders", id), { status: newStatus, updatedAt: new Date().toISOString() });
            await addDoc(collection(db, "orders", id, "statusEvents"), {
                status: newStatus,
                note: internalNote.trim() || `Order status updated to ${newStatus}`,
                createdAt: new Date().toISOString()
            });

            setInternalNote("");
            toast.success("Order status updated");
            await loadOrderData();
        } catch (err: any) {
            toast.error("Failed to update status: " + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-muted-foreground">Loading order details...</div>;
    if (!order) return <div className="py-20 text-center text-muted-foreground">Order not found.</div>;

    return (
        <div className="space-y-6 pt-4 pb-12 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link to="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">Order {order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}</h1>
                            <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-xs uppercase">{order.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" /> {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_350px]">
                {/* Left Column: Items and Fulfillment info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 last:pb-0">
                                        <div className="h-16 w-16 bg-muted rounded-md overflow-hidden shrink-0">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover mix-blend-multiply" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                    <Package className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm leading-tight">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.qty} × ₦{item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="font-mono font-medium">
                                            ₦{(item.price * item.qty).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm py-2">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={order.payment?.status === "paid" ? "default" : "destructive"}>
                                    {order.payment?.status?.toUpperCase() || "UNPAID"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2">
                                <span className="text-muted-foreground">Provider</span>
                                <span className="uppercase">{order.payment?.provider || "N/A"}</span>
                            </div>
                            {order.payment?.reference && (
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-muted-foreground">Reference</span>
                                    <span className="font-mono">{order.payment.reference}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>₦{order.subtotal?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Delivery Fee</span>
                                    <span>₦{order.deliveryFee?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2">
                                    <span>Total</span>
                                    <span>₦{order.total?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Customer, Details & Admin Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Fulfillment Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Status</label>
                                <Select value={order.status} onValueChange={handleUpdateStatus} disabled={updatingStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
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
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Internal Note (Optional)</label>
                                <Textarea
                                    placeholder="E.g. Shipped via GIG Logistics tracking #12345"
                                    value={internalNote}
                                    onChange={e => setInternalNote(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="font-medium">{order.customer?.name}</p>
                                <p className="text-muted-foreground">{order.customer?.email}</p>
                                <p className="text-muted-foreground">{order.customer?.phone}</p>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Shipping Address</span>
                                </div>
                                <p className="text-muted-foreground">{order.shippingAddress?.fullName}</p>
                                <p className="text-muted-foreground">{order.shippingAddress?.addressLine1}</p>
                                <p className="text-muted-foreground">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                <p className="text-muted-foreground">{order.shippingAddress?.phone}</p>
                                {order.shippingAddress?.notes && (
                                    <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                                        <span className="font-medium">Delivery Instructions:</span><br />
                                        {order.shippingAddress.notes}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {events.map((evt, i) => (
                                    <div key={i} className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0">
                                        <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium uppercase leading-none">{evt.status}</p>
                                                <span className="text-xs text-muted-foreground">{new Date(evt.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {evt.note && <p className="text-xs text-muted-foreground">{evt.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
