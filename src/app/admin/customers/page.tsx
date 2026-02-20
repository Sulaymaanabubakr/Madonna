"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminCustomersPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/admin/customers", { headers: { Authorization: `Bearer ${token}` } });
      setItems((await res.json()).items || []);
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-5">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{item.name || "Unknown"}</p>
              <p className="text-muted-foreground">{item.email}</p>
              <p className="text-muted-foreground">Orders: {item.orderCount || 0}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
