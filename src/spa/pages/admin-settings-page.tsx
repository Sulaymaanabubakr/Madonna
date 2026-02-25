import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StoreSettings } from "@/types";

const initialSettings: StoreSettings = {
  storeName: "",
  storeAddress: "",
  phone: "",
  email: "",
  whatsapp: "",
  deliveryFee: 2000,
  announcementEnabled: false,
  announcementText: "",
  announcementSpeed: 22,
  updatedAt: "",
};

export function AdminSettingsPage() {
  const { getToken, user, profile, loading } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSettings(data.item || initialSettings);
    };
    if (profile?.role === "admin") load();
  }, [getToken, profile?.role]);

  if (loading) return <div className="container py-10">Loading...</div>;
  if (!user) return <Navigate to="/account" replace />;
  if (profile?.role !== "admin") return <Navigate to="/account" replace />;

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
    <AdminShell>
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
            <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
              <input type="checkbox" checked={Boolean(settings.announcementEnabled)} onChange={(e) => setSettings({ ...settings, announcementEnabled: e.target.checked })} />
              Enable announcement ticker
            </label>
            <Input className="md:col-span-2" value={settings.announcementText || ""} onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })} placeholder="Announcement text" />
            <Input type="number" min={8} max={60} value={settings.announcementSpeed || 22} onChange={(e) => setSettings({ ...settings, announcementSpeed: Number(e.target.value) })} placeholder="Announcement speed" />
            <Button onClick={save}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
