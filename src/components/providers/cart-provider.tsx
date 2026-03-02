

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types";

const CART_KEY = "madonna-cart-v1";

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setQty: (productId: string, qty: number) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // Corrupted storage — start with an empty cart
      localStorage.removeItem(CART_KEY);
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
      sync([...items, item]);
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
    () => ({ items, count, subtotal, addItem, removeItem, clearCart, setQty }),
    [items, count, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
