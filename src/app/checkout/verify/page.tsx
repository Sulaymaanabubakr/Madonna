"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";

export default function VerifyCheckoutPage() {
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");
    const { clearCart } = useCart();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!reference) {
            setStatus("error");
            setErrorMsg("No payment reference found.");
            return;
        }

        const verifyPayment = async () => {
            try {
                const res = await fetch("/api/paystack/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reference }),
                });

                const data = await res.json();
                if (data.success) {
                    setStatus("success");
                    clearCart(); // Clear local storage cart safely upon verified completion
                } else {
                    setStatus("error");
                    setErrorMsg(data.error || "Verification failed. Please contact support.");
                }
            } catch {
                setStatus("error");
                setErrorMsg("A network error occurred verifying your payment.");
            }
        };

        verifyPayment();
    }, [reference, clearCart]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F4F4] px-4 py-16">
            <div className="w-full max-w-md border border-zinc-200 bg-white p-8 text-center shadow-sm">
                {status === "loading" && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#8B2030]" />
                        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900">
                            Verifying Payment
                        </h2>
                        <p className="mt-2 text-[13px] text-zinc-500">
                            Please wait while we confirm your transaction securely.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle2 className="mb-4 h-16 w-16 text-green-600" />
                        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900">
                            Payment Successful
                        </h2>
                        <p className="mt-2 text-[13px] text-zinc-500">
                            Thank you for your order! Your payment has been confirmed and we are preparing your items.
                        </p>
                        <Button
                            asChild
                            className="mt-8 h-12 rounded-none bg-[#222222] px-8 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-[#8B2030]"
                        >
                            <Link href="/account">View My Orders</Link>
                        </Button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <XCircle className="mb-4 h-16 w-16 text-red-600" />
                        <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900">
                            Payment Failed
                        </h2>
                        <p className="mt-2 text-[13px] text-red-600">
                            {errorMsg}
                        </p>
                        <p className="mt-4 text-[13px] text-zinc-500">
                            If your account was debited, please contact us immediately with your reference number:
                            <br />
                            <strong className="text-zinc-900">{reference}</strong>
                        </p>
                        <Button
                            asChild
                            className="mt-8 h-12 rounded-none bg-[#222222] px-8 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-[#8B2030]"
                        >
                            <Link href="/checkout">Return to Checkout</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
