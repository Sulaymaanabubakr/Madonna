"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const checkoutSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(10, "Full address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    orderNotes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const { items, subtotal } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);

    // In a real implementation this would integrate with Paystack
    const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
    });

    const { user } = useAuth();

    // Ensure cart isn't empty on load
    useEffect(() => {
        if (items.length === 0 && !isProcessing) {
            router.push("/shop");
        }
    }, [items, router, isProcessing]);

    if (items.length === 0 && !isProcessing) return null;

    const onSubmit = async (data: CheckoutValues) => {
        setIsProcessing(true);
        try {
            // 1. Create Pending Order in Firestore
            const orderPayload = {
                customer: { name: `${data.firstName} ${data.lastName}`, email: data.email, phone: data.phone },
                shippingAddress: {
                    fullName: `${data.firstName} ${data.lastName}`,
                    phone: data.phone,
                    addressLine1: data.address,
                    city: data.city,
                    state: data.state,
                    notes: data.orderNotes,
                },
                items,
                subtotal,
                deliveryFee: 0,
                total: subtotal,
                userId: user?.uid,
            };

            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });
            const orderData = await orderRes.json();
            if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

            // 2. Initialize Paystack Transaction
            const paystackRes = await fetch("/api/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderData.orderId,
                    email: data.email,
                    amount: orderData.amount,
                }),
            });
            const paystackData = await paystackRes.json();
            if (!paystackData.success) throw new Error(paystackData.error || "Failed to initialize payment");

            // 3. Redirect off-site to Paystack
            window.location.href = paystackData.authorization_url;
        } catch (err: any) {
            toast.error(err.message || "A checkout error occurred.", { style: { borderRadius: '0px' } });
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-[#F4F4F4] pb-24">
            {/* ── Breadcrumb ── */}
            <div className="border-b border-zinc-200 bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">
                            CHECKOUT
                        </h1>
                        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <Link href="/" className="hover:text-[#8B2030]">HOME</Link>
                            <ChevronRight className="mx-2 h-3 w-3" />
                            <span className="text-zinc-900">CHECKOUT</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-12 lg:grid-cols-12 lg:gap-16">

                    {/* ── Billing Details ── */}
                    <div className="lg:col-span-7">
                        <h3 className="mb-4 text-xl font-bold uppercase tracking-widest text-zinc-900">
                            Billing Details
                        </h3>
                        <div className="mb-8 h-[2px] w-[50px] bg-[#8B2030]" />

                        <div className="space-y-6 bg-white p-8 shadow-sm border border-zinc-200">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700">First Name *</label>
                                    <Input {...register("firstName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700">Last Name *</label>
                                    <Input {...register("lastName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-zinc-700">Phone *</label>
                                <Input {...register("phone")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-zinc-700">Email Address *</label>
                                <Input {...register("email")} type="email" className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-zinc-700">Street Address *</label>
                                <Input {...register("address")} placeholder="House number and street name" className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700">Town / City *</label>
                                    <Input {...register("city")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                    {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700">State *</label>
                                    <Input {...register("state")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                                    {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2 pt-6">
                                <label className="text-[12px] font-bold text-zinc-700">Order Notes (optional)</label>
                                <textarea
                                    {...register("orderNotes")}
                                    placeholder="Notes about your order, e.g. special notes for delivery."
                                    className="min-h-[120px] w-full border border-zinc-300 p-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#8B2030] focus:ring-offset-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Order Review ── */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 border-t-[3px] border-[#8B2030] bg-white p-8 shadow-sm border border-zinc-200">
                            <h3 className="mb-6 text-xl font-bold uppercase tracking-widest text-zinc-900">
                                Your Order
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b text-[12px] font-bold uppercase tracking-widest text-zinc-900 pb-2 border-zinc-200">
                                    <span>Product</span>
                                    <span>Total</span>
                                </div>

                                <div className="space-y-4 py-2">
                                    {items.map((item) => (
                                        <div key={item.productId} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] text-zinc-600">{item.name}</span>
                                                <span className="text-xs font-bold text-zinc-900">× {item.qty}</span>
                                            </div>
                                            <span className="text-[14px] font-semibold text-zinc-900 border-l pl-4 border-zinc-100">
                                                {formatCurrency(item.price * item.qty)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t py-4 text-[12px] font-bold uppercase tracking-widest text-zinc-900 border-zinc-200">
                                    <span>Subtotal</span>
                                    <span className="text-[15px]">{formatCurrency(subtotal)}</span>
                                </div>

                                <div className="flex items-center justify-between border-b pb-4 text-[12px] font-bold uppercase tracking-widest text-zinc-900 border-zinc-200">
                                    <span>Shipping</span>
                                    <span className="text-[15px] font-semibold text-[#8B2030]">Calculated next</span>
                                </div>

                                <div className="flex items-center justify-between py-4 text-xl font-bold uppercase tracking-widest text-zinc-900">
                                    <span>Total</span>
                                    <span className="text-[#8B2030]">{formatCurrency(subtotal)}</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4 rounded-sm bg-[#F4F4F4] p-6 text-sm text-zinc-600 border border-zinc-200">
                                <p>
                                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="mt-6 h-14 w-full rounded-none bg-[#222222] text-[13px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#8B2030]"
                            >
                                {isProcessing ? "Processing..." : "Place Order"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
