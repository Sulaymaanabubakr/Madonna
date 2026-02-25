"use client";

import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/query";

export function CartDrawer({ children }: { children: React.ReactNode }) {
    const { items, setQty, removeItem, subtotal } = useCart();

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col p-0 sm:max-w-md rounded-none border-l border-zinc-200">
                <SheetHeader className="border-b bg-zinc-50 p-6">
                    <SheetDescription className="sr-only">
                        Review selected items, adjust quantities, and proceed to checkout.
                    </SheetDescription>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="font-serif text-xl font-bold uppercase tracking-widest text-[#8B2030]">
                            Shopping Cart
                        </SheetTitle>
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-zinc-200">
                                <X className="h-4 w-4" />
                            </Button>
                        </SheetClose>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
                                <ShoppingBag className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-zinc-900">Your cart is empty.</p>
                                <p className="text-sm text-zinc-500">Looks like you haven't added anything yet.</p>
                            </div>
                            <SheetClose asChild>
                                <Button className="mt-4 rounded-none bg-[#8B2030] px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#721a27]">
                                    Return to Shop
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.productId} className="flex gap-4">
                                    <div className="relative h-24 w-20 shrink-0 bg-[#F4F4F4]">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div className="flex items-start justify-between gap-2">
                                            <Link to={item.productSlug ? `/product/${item.productSlug}` : "/shop"} className="text-[13px] font-semibold text-zinc-800 hover:text-[#8B2030]">
                                                {item.name}
                                            </Link>
                                            <button onClick={() => removeItem(item.productId)} className="text-zinc-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center border border-zinc-200">
                                                <button
                                                    onClick={() => setQty(item.productId, item.qty - 1)}
                                                    className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="flex h-8 w-8 items-center justify-center text-[13px] font-medium text-zinc-900 border-x border-zinc-200">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() => setQty(item.productId, item.qty + 1)}
                                                    disabled={item.qty >= item.stockQty}
                                                    className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span className="text-[14px] font-extrabold text-[#8B2030]">
                                                {formatCurrency(item.price * item.qty)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t bg-zinc-50 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Subtotal</span>
                            <span className="text-lg font-bold text-zinc-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="grid gap-3">
                            <SheetClose asChild>
                                <Link to="/checkout">
                                    <Button variant="outline" className="w-full rounded-none border-zinc-300 text-xs font-bold uppercase tracking-widest text-zinc-900 hover:bg-zinc-100">
                                        View Checkout
                                    </Button>
                                </Link>
                            </SheetClose>
                            <SheetClose asChild>
                                <Link to="/checkout">
                                    <Button className="w-full rounded-none bg-[#8B2030] text-xs font-bold uppercase tracking-widest text-white hover:bg-[#721a27]">
                                        Checkout
                                    </Button>
                                </Link>
                            </SheetClose>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
