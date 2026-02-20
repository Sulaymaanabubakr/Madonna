"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    const token = await getToken();
    if (!token) return;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((await res.json()).items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus, note: `Status changed to ${newStatus}` }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <Card className="rounded-2xl">
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Input placeholder="Search order/customer" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button onClick={load}>Apply</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((order) => (
          <Card key={order.id} className="rounded-2xl">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm uppercase text-primary">{order.status}</p>
              </div>
              <p className="text-sm text-muted-foreground">{order.customer?.name} - {order.customer?.email}</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <Button key={s} size="sm" variant={order.status === s ? "default" : "outline"} onClick={() => updateStatus(order.id, s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
