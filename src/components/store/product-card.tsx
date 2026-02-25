"use client";

import { Link } from "react-router-dom";
import { Star, ShoppingBag, Eye } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/query";
import { toast } from "sonner";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();

    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
        : 0;

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        if (product.stockQty < 1) return;

        addItem({
            productId: product.id,
            productSlug: product.slug,
            name: product.name,
            price: product.price,
            qty: 1,
            imageUrl: product.images[0]?.url || "/placeholder.svg",
            stockQty: product.stockQty,
        });
        toast.success(`${product.name} added to your cart`, {
            style: { borderRadius: '0px' }
        });
    };

    return (
        <div className="group relative text-center">
            {/* ── Image Wrapper (`#F4F4F4` background, no borders) ── */}
            <Link to={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-[#F4F4F4]">
                <img
                    src={product.images[0]?.url || "/placeholder.svg"}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* ── Badges ── */}
                <div className="absolute left-3 top-3 flex flex-col gap-1">
                    {hasDiscount && (
                        <span className="flex h-[22px] min-w-[40px] items-center justify-center bg-[#E27C7C] px-2 text-[10px] font-bold uppercase text-white shadow-sm">
                            -{discountPct}%
                        </span>
                    )}
                    {product.newArrival && (
                        <span className="flex h-[22px] min-w-[40px] items-center justify-center bg-[#0088CC] px-2 text-[10px] font-bold uppercase text-white shadow-sm">
                            New
                        </span>
                    )}
                    {product.bestSeller && (
                        <span className="flex h-[22px] min-w-[40px] items-center justify-center bg-[#62B959] px-2 text-[10px] font-bold uppercase text-white shadow-sm">
                            Hot
                        </span>
                    )}
                </div>

                {/* ── Hover Actions Overlay (Dark Add to Cart bar sliding up) ── */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                    <button
                        onClick={handleAdd}
                        disabled={product.stockQty < 1}
                        className="flex w-full items-center justify-center gap-2 bg-[#222222] py-3.5 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#8B2030] disabled:cursor-not-allowed disabled:bg-zinc-400"
                    >
                        {product.stockQty < 1 ? (
                            "Out of Stock"
                        ) : (
                            <>
                                <ShoppingBag className="h-4 w-4" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>

                {/* Optional Quick View button (desktop only) */}
                <div className="absolute right-3 top-3 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block">
                    <button
                        title="Quick View"
                        className="flex h-10 w-10 items-center justify-center bg-white text-zinc-900 shadow-sm transition-colors hover:bg-[#8B2030] hover:text-white"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                </div>
            </Link>

            {/* ── Product Info Below Image (Centered) ── */}
            <div className="mt-4 flex flex-col items-center px-2">
                {/* Category Label */}
                <p className="max-w-full truncate text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {product.categoryName}
                </p>

                {/* Title */}
                <Link to={`/product/${product.slug}`} className="mt-1 max-w-full truncate text-[13px] font-semibold text-zinc-800 transition-colors hover:text-[#8B2030]">
                    {product.name}
                </Link>

                {/* Stars */}
                <div className="mt-1.5 flex items-center gap-[2px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-zinc-800 text-zinc-800" : "fill-zinc-200 text-zinc-200"}`} />
                    ))}
                </div>

                {/* Price */}
                <div className="mt-2 flex items-center gap-2">
                    {hasDiscount && (
                        <span className="text-sm text-zinc-400 line-through">{formatCurrency(product.compareAtPrice!)}</span>
                    )}
                    <span className="text-[15px] font-extrabold text-[#8B2030]">
                        {formatCurrency(product.price)}
                    </span>
                </div>
            </div>
        </div>
    );
}
