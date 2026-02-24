"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/query";
import { Package, Truck, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import type { Order, StatusEvent } from "@/types";

export default function TrackOrderPage({ params }: { params: { orderId: string } }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [events, setEvents] = useState<StatusEvent[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, loading: authLoading, getToken } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace("/track");
            return;
        }

        const run = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setError("Unauthorized");
                    return;
                }

                const res = await fetch(`/api/orders/${params.orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    setError(data.error || "Failed to load order");
                } else {
                    setOrder(data.order);
                    setEvents(data.events || []);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [authLoading, getToken, params.orderId, router, user]);

    if (loading) {
        return <div className="flex min-h-[50vh] items-center justify-center">Loading timeline...</div>;
    }

    if (error || !order) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center bg-[#F4F4F4]">
                <div className="border border-zinc-200 bg-white p-12 text-center text-red-600">
                    Failed to load order: {error || "Not found"}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F4F4F4] pb-24">
            {/* ── Breadcrumb ── */}
            <div className="border-b border-zinc-200 bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">
                            TRACK ORDER
                        </h1>
                        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <Link href="/account" className="hover:text-[#8B2030]">MY ACCOUNT</Link>
                            <ChevronRight className="mx-2 h-3 w-3" />
                            <span className="text-zinc-900">#{order.orderNumber}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-4xl space-y-8">

                    {/* Summary Card */}
                    <div className="border border-zinc-200 bg-white p-8 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Order Reference</p>
                                <p className="text-xl font-black text-zinc-900">{order.orderNumber}</p>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</p>
                                    <p className="text-[13px] font-bold text-zinc-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Amount</p>
                                    <p className="text-[13px] font-bold text-[#8B2030]">{formatCurrency(order.total)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="my-8 h-[1px] w-full bg-zinc-200" />

                        <div className="grid gap-8 md:grid-cols-2">
                            <div>
                                <h3 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-zinc-900">Items Purchased</h3>
                                <div className="space-y-3">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-[13px]">
                                            <span className="text-zinc-600">{item.qty} x {item.name}</span>
                                            <span className="font-semibold text-zinc-900">{formatCurrency(item.qty * item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-zinc-900">Delivery Address</h3>
                                <p className="text-[13px] text-zinc-600 whitespace-pre-wrap">
                                    {order.shippingAddress?.fullName}<br />
                                    {order.shippingAddress?.addressLine1}<br />
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                                    {order.shippingAddress?.phone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Timeline */}
                    <div className="border border-zinc-200 bg-white p-8 shadow-sm">
                        <h3 className="mb-6 text-[15px] font-black uppercase tracking-widest text-zinc-900">Order Updates</h3>
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent">
                            {events.map((event, idx) => {
                                const isNewest = idx === 0;
                                return (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${isNewest ? "bg-[#8B2030] text-white" : "bg-zinc-200 text-zinc-500"} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                            {event.status === "delivered" ? <CheckCircle2 className="w-4 h-4" /> : event.status === "shipped" ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#F4F4F4] p-4 rounded-sm shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-zinc-900 uppercase text-[12px] tracking-widest">{event.status}</h4>
                                                <time className="text-[10px] font-bold text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.createdAt).toLocaleDateString()}</time>
                                            </div>
                                            {event.note && <p className="text-[12px] text-zinc-600">{event.note}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
