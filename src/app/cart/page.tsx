"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/query";

export default function CartPage() {
  const { items, setQty, removeItem, subtotal } = useCart();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-black uppercase tracking-widest">Cart</h1>
      {items.length === 0 ? (
        <div className="border p-8">
          <p className="mb-4">Your cart is empty.</p>
          <Button asChild><Link href="/shop">Continue shopping</Link></Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 border p-4">
                <div className="relative h-24 w-24 shrink-0 bg-zinc-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-zinc-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-8 w-8 border" onClick={() => setQty(item.productId, item.qty - 1)}>-</button>
                    <span className="w-8 text-center">{item.qty}</span>
                    <button className="h-8 w-8 border" onClick={() => setQty(item.productId, item.qty + 1)}>+</button>
                  </div>
                  <button className="text-sm text-red-600" onClick={() => removeItem(item.productId)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="h-fit border p-6">
            <p className="mb-2 text-sm uppercase tracking-wider text-zinc-500">Subtotal</p>
            <p className="mb-6 text-2xl font-bold">{formatCurrency(subtotal)}</p>
            <Button asChild className="w-full bg-[#8B2030] hover:bg-[#721a27]">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
