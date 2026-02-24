"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/query";
import { toast } from "sonner";
import { Package, Truck, CheckCircle2, Copy } from "lucide-react";
import type { Order } from "@/types";

export default function AccountPage() {
    const { user, profile, loading, login, register, logout, getToken } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Auth Form State
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    useEffect(() => {
        if (user && profile?.role === "customer") {
            setIsLoadingOrders(true);
            getToken().then((token) => {
                if (!token) return;
                fetch("/api/orders/me", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.items) setOrders(data.items);
                    })
                    .catch(() => undefined)
                    .finally(() => setIsLoadingOrders(false));
            });
        }
    }, [user, profile, getToken]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthLoading(true);
        try {
            if (isLoginView) {
                await login(email, password);
                toast.success("Welcome back!", { style: { borderRadius: '0px' } });
            } else {
                await register(name, email, password);
                toast.success("Account created successfully", { style: { borderRadius: '0px' } });
            }
        } catch (err: any) {
            toast.error(err.message, { style: { borderRadius: '0px' } });
        } finally {
            setIsAuthLoading(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-[50vh] items-center justify-center">Loading...</div>;
    }

    // ── Unauthenticated View (Login/Register) ──
    if (!user) {
        return (
            <div className="bg-[#F4F4F4] py-16">
                <div className="container mx-auto max-w-md px-4">
                    <div className="border border-zinc-200 bg-white p-8 shadow-sm">
                        <h2 className="mb-6 text-center text-2xl font-black uppercase tracking-widest text-zinc-900">
                            {isLoginView ? "Sign In" : "Register"}
                        </h2>
                        <form onSubmit={handleAuth} className="space-y-4">
                            {!isLoginView && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                                    <Input
                                        value={name} onChange={(e) => setName(e.target.value)}
                                        className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]"
                                        required={!isLoginView}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                                <Input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
                                <Input
                                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]"
                                    required minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isAuthLoading}
                                className="mt-4 h-12 w-full rounded-none bg-[#222222] text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#8B2030]"
                            >
                                {isAuthLoading ? "Processing..." : isLoginView ? "Log In" : "Create Account"}
                            </Button>
                        </form>
                        <div className="mt-6 text-center text-[13px] text-zinc-500">
                            {isLoginView ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLoginView(!isLoginView)} className="font-bold text-zinc-900 hover:text-[#8B2030]">
                                {isLoginView ? "Register Now" : "Log In"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Authenticated User Dashboard (Porto Style) ──
    return (
        <div className="bg-[#F4F4F4] pb-24">
            {/* ── Header ── */}
            <div className="border-b border-zinc-200 bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black uppercase tracking-widest text-zinc-900">
                            MY ACCOUNT
                        </h1>
                        <Button onClick={logout} variant="outline" className="h-10 rounded-none border-zinc-300 text-xs font-bold uppercase tracking-widest">
                            Log Out
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 lg:grid-cols-4">

                    {/* Sidebar Overview */}
                    <div className="lg:col-span-1 border border-zinc-200 bg-white p-6 shadow-sm self-start">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Profile</h3>
                        <div className="my-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-[13px] text-zinc-600 font-bold">{profile?.name}</p>
                        <p className="text-[12px] text-zinc-500">{profile?.email}</p>

                        <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-zinc-900">Orders overview</h3>
                        <div className="my-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-[24px] font-black text-zinc-900">{orders.length}</p>
                    </div>

                    {/* Orders List */}
                    <div className="lg:col-span-3">
                        <h2 className="mb-6 font-serif text-2xl font-bold uppercase text-zinc-900">Order History</h2>

                        {isLoadingOrders ? (
                            <div className="h-32 animate-pulse bg-white border border-zinc-200"></div>
                        ) : orders.length === 0 ? (
                            <div className="border border-zinc-200 bg-white p-12 text-center text-zinc-500">
                                No orders found. <Link href="/shop" className="text-[#8B2030] font-bold">Start Shopping.</Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4 mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order Placed</p>
                                                <p className="text-[13px] text-zinc-900 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
                                                <p className="text-[13px] text-zinc-900 font-bold">{formatCurrency(order.total || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order Number</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-zinc-900 font-bold">{order.orderNumber}</span>
                                                    <button onClick={() => {
                                                        navigator.clipboard.writeText(order.orderNumber || order.id);
                                                        toast.success("Copied!");
                                                    }} className="text-zinc-400 hover:text-[#8B2030]"><Copy className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {order.status === "delivered" ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                ) : order.status === "shipped" ? (
                                                    <Truck className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-zinc-500" />
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">
                                                        {order.status}
                                                    </span>
                                                    <span className="text-[11px] text-zinc-500">
                                                        {order.items?.length || 0} items
                                                    </span>
                                                </div>
                                            </div>
                                            <Button asChild variant="outline" className="h-10 rounded-none border-zinc-300 text-[11px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-[#8B2030] hover:text-white">
                                                <Link href={`/track/${order.id}`}>Track / View Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
