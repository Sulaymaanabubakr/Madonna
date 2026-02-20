"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/query";

export default function AdminOverviewPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/orders", { headers }),
        fetch("/api/admin/products", { headers }),
      ]);
      setOrders((await ordersRes.json()).items || []);
      setProducts((await productsRes.json()).items || []);
    };
    run();
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => String(o.createdAt || "").slice(0, 10) === today).length;
    const totalSales = orders.reduce((acc, item) => acc + Number(item.total || 0), 0);
    const lowStock = products.filter((p) => Number(p.stockQty || 0) < 5).length;
    return { todayOrders, totalSales, lowStock, totalOrders: orders.length };
  }, [orders, products]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Today Orders</p><p className="text-2xl font-semibold">{metrics.todayOrders}</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-semibold">{formatCurrency(metrics.totalSales)}</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Low Stock</p><p className="text-2xl font-semibold">{metrics.lowStock}</p></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-semibold">{metrics.totalOrders}</p></CardContent></Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <h2 className="mb-3 font-semibold">Recent Orders</h2>
          <div className="space-y-2">
            {orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between rounded-lg border p-3 text-sm">
                <span>{order.orderNumber}</span>
                <span className="uppercase text-primary">{order.status}</span>
                <span>{formatCurrency(order.total || 0)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
