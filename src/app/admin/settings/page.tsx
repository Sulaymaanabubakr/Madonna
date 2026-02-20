"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<any>({
    storeName: "",
    storeAddress: "",
    phone: "",
    email: "",
    whatsapp: "",
    deliveryFee: 2000,
  });

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSettings(data.item || settings);
    };
    load();
  }, []);

  const save = async () => {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="rounded-2xl">
        <CardContent className="grid gap-3 p-5 md:grid-cols-2">
          <Input value={settings.storeName || ""} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} placeholder="Store Name" />
          <Input value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="Phone" />
          <Input value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} placeholder="Email" />
          <Input value={settings.whatsapp || ""} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="WhatsApp" />
          <Input className="md:col-span-2" value={settings.storeAddress || ""} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} placeholder="Store Address" />
          <Input type="number" value={settings.deliveryFee || 0} onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })} placeholder="Delivery fee" />
          <Button onClick={save}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
