

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types";

const CART_KEY = "madonna-cart-v1";

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setQty: (productId: string, qty: number) => void;
};

const CartContext = createContext<CartContextType | null>(null);

function normalizeCartItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => raw as Partial<CartItem>)
    .map((item) => {
      const productId = String(item.productId || "").trim();
      const name = String(item.name || "").trim();
      const imageUrl = String(item.imageUrl || "/placeholder.svg").trim();
      const price = Number(item.price || 0);
      const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
      const stockQty = Math.max(0, Math.floor(Number(item.stockQty || 0)));
      const safeQty = stockQty > 0 ? Math.min(qty, stockQty) : qty;

      return {
        productId,
        productSlug: item.productSlug
          ? String(item.productSlug)
          : (item as Partial<CartItem> & { slug?: string }).slug
            ? String((item as Partial<CartItem> & { slug?: string }).slug)
            : undefined,
        name,
        imageUrl: imageUrl || "/placeholder.svg",
        price: Number.isFinite(price) ? price : 0,
        qty: safeQty,
        stockQty,
      } as CartItem;
    })
    .filter((item) => item.productId.length > 0 && item.name.length > 0 && item.qty > 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(normalizeCartItems(JSON.parse(raw)));
    } catch {
      // Corrupted storage — start with an empty cart
      localStorage.removeItem(CART_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const sync = (nextItems: CartItem[]) => {
    setItems(nextItems);
  };

  const addItem = (item: CartItem) => {
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      const next = items.map((i) =>
        i.productId === item.productId ? { ...i, qty: Math.min(i.qty + item.qty, i.stockQty) } : i,
      );
      sync(next);
    } else {
      sync([
        ...items,
        {
          ...item,
          qty: Math.max(1, Math.min(item.qty, item.stockQty)),
        },
      ]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const removeItem = (productId: string) => {
    sync(items.filter((i) => i.productId !== productId));
  };

  const clearCart = () => sync([]);

  const setQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    const next = items.map((i) =>
      i.productId === productId ? { ...i, qty: Math.min(qty, i.stockQty) } : i,
    );
    sync(next);
  };

  const count = items.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = items.reduce((acc, item) => acc + item.qty * item.price, 0);

  const value = useMemo(
    () => ({ items, count, subtotal, ready, addItem, removeItem, clearCart, setQty }),
    [items, count, subtotal, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
