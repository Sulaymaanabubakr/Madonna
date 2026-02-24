"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/store/section-title";
import { ProductCard } from "@/components/store/product-card";
import { fetcher } from "@/lib/api";
import type { Product } from "@/types";
import { toast } from "sonner";

const categories = [
    { name: "FASHION", slug: "fashion-accessories" },
    { name: "BEAUTY", slug: "beauty-personal-care" },
    { name: "FOODSTUFF", slug: "foodstuff-groceries" },
];

export default function HomePage() {
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [newsletterEmail, setNewsletterEmail] = useState("");

    useEffect(() => {
        fetcher<{ items: Product[] }>("/api/products?pageSize=8&sort=best")
            .then((res) => setBestSellers(res.items.filter((p) => p.bestSeller).slice(0, 4)))
            .catch(() => undefined);
        fetcher<{ items: Product[] }>("/api/products?pageSize=8&sort=new")
            .then((res) => setNewArrivals(res.items.filter((p) => p.newArrival).slice(0, 4)))
            .catch(() => undefined);
    }, []);

    const submitNewsletter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newsletterEmail }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Subscription failed");
            setNewsletterEmail("");
            toast.success("You are now subscribed.");
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    return (
        <div className="bg-white">
            {/* ══════ HERO SECTION (Animated, Image Background) ══════ */}
            <section className="relative flex min-h-[500px] items-center bg-zinc-900 lg:min-h-[600px] overflow-hidden">
                {/* Animated Background Image */}
                <motion.div
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
                        alt="Madonna Link Express Hero"
                        fill
                        className="object-cover opacity-50 mix-blend-overlay"
                        priority
                    />
                </motion.div>

                {/* Dark Gradient Overlay for text readability */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                <div className="container relative mx-auto grid px-4 py-12 md:grid-cols-2 md:items-center z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-center md:text-left"
                    >
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-white drop-shadow-md">
                            Welcome to Oshodi's Finest
                        </h2>
                        <h1 className="mt-4 font-sans text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-xl">
                            PREMIUM
                            <br />
                            <span className="text-[#8B2030]">SELECTION</span>
                        </h1>
                        <p className="mt-6 font-serif text-lg text-zinc-200 sm:text-xl drop-shadow-md max-w-md mx-auto md:mx-0">
                            Shop Quality, Live Beautiful. Fashion, beauty, foodstuff & essential groceries from Lagos.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                            <Button asChild className="h-12 rounded-none bg-[#8B2030] px-10 text-[13px] font-bold uppercase tracking-widest text-white hover:bg-[#721a27] shadow-lg">
                                <Link href="/shop?category=fashion-accessories">Shop Fashion</Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12 rounded-none border-2 border-white bg-transparent px-10 text-[13px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-zinc-900 shadow-lg transition-colors">
                                <Link href="/shop?category=foodstuff-groceries">Shop Foodstuff</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══════ FILTER BY BAR ══════ */}
            <section className="border-b border-zinc-200">
                <div className="container mx-auto flex items-center justify-center gap-1 overflow-x-auto px-4 py-4 no-scrollbar sm:gap-2">
                    <span className="mr-2 shrink-0 text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-800">
                        FILTER BY:
                    </span>
                    {categories.map((cat, idx) => (
                        <div key={cat.name} className="flex items-center">
                            <Link
                                href={`/category/${cat.slug}`}
                                className="shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-[#8B2030]"
                            >
                                {cat.name}
                            </Link>
                            {idx < categories.length - 1 && <span className="mx-1 text-zinc-300">|</span>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════ POPULAR PRODUCTS ══════ */}
            <section className="container mx-auto px-4 py-16 sm:py-24">
                <SectionTitle title="POPULAR PRODUCTS" align="center" viewAllHref="/shop?sort=best" />
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                    {bestSellers.length > 0 ? (
                        bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] animate-pulse bg-zinc-100" />
                        ))
                    )}
                </div>
            </section>

            {/* ══════ PROMO BANNERS ══════ */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Banner 1: Dark */}
                    <Link href="/shop" className="group relative block overflow-hidden bg-zinc-900 px-10 py-16 sm:py-24">
                        <div className="relative z-10 text-center text-white">
                            <h3 className="font-serif text-3xl font-bold uppercase sm:text-4xl md:text-5xl">
                                EXCLUSIVE
                                <br />DEALS
                            </h3>
                            <p className="mt-4 text-sm uppercase tracking-widest text-zinc-400">Incredible Discounts</p>
                            <div className="mt-8 flex justify-center">
                                <span className="inline-flex h-12 items-center justify-center border border-white px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-white group-hover:text-zinc-900">
                                    SHOP NOW
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Banner 2: Light Grey + Maroon Accent */}
                    <Link href="/shop" className="group relative block overflow-hidden bg-[#F4F4F4] px-10 py-16 sm:py-24">
                        <div className="relative z-10 text-center text-zinc-900">
                            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[#8B2030]">Top 10+</p>
                            <h3 className="font-serif text-3xl font-bold uppercase sm:text-4xl md:text-5xl">
                                UNDER <span className="text-[#8B2030]">₦5K</span>
                            </h3>
                            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-zinc-500">Selected Essentials</p>
                            <div className="mt-8 flex justify-center">
                                <span className="inline-flex h-12 items-center justify-center border border-zinc-900 px-8 text-[11px] font-bold uppercase tracking-widest text-zinc-900 transition-colors group-hover:bg-[#8B2030] group-hover:border-[#8B2030] group-hover:text-white">
                                    SHOP NOW
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* ══════ FEATURED ITEMS ══════ */}
            <section className="container mx-auto px-4 py-16 sm:py-24">
                <SectionTitle title="FEATURED ITEMS" align="center" viewAllHref="/shop?sort=new" />
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                    {newArrivals.length > 0 ? (
                        newArrivals.map((p) => <ProductCard key={p.id} product={p} />)
                    ) : (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] animate-pulse bg-zinc-100" />
                        ))
                    )}
                </div>
            </section>

            {/* ══════ NEWSLETTER (Porto Style) ══════ */}
            <section className="border-t border-zinc-200 bg-[#F4F4F4]">
                <div className="container mx-auto px-4 py-16 sm:py-20">
                    <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-8 md:flex-row">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900">
                                NEWSLETTER
                            </h3>
                            <p className="mt-2 text-sm text-zinc-500">
                                Get all the latest information on Events, Sales and Offers.
                            </p>
                        </div>

                        <form className="flex w-full max-w-lg shadow-sm" onSubmit={submitNewsletter}>
                            <Input
                                type="email"
                                placeholder="Email address..."
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                className="h-14 flex-1 rounded-none border-none bg-white px-6 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                                required
                            />
                            <Button type="submit" className="h-14 rounded-none bg-[#8B2030] px-8 text-[12px] font-black uppercase tracking-[0.1em] text-white hover:bg-[#721a27]">
                                Submit
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
