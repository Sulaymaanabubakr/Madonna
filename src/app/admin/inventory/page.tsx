"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminInventoryPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } });
    setItems((await res.json()).items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (id: string, stockQty: number) => {
    const token = await getToken();
    if (!token) return;
    const product = items.find((i) => i.id === id);
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...product, stockQty }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className={Number(item.stockQty) < 5 ? "text-destructive" : "text-muted-foreground"}>Current stock: {item.stockQty}</p>
              </div>
              <Input
                type="number"
                className="w-24"
                defaultValue={item.stockQty}
                onBlur={(e) => updateStock(item.id, Number(e.target.value))}
              />
              <Button size="sm" variant="outline" onClick={() => updateStock(item.id, Number(item.stockQty) + 1)}>
                +1
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
