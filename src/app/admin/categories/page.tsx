"use client";

import { useEffect, useState } from "react";
import slugify from "slugify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";

export default function AdminCategoriesPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createCategory = async () => {
    const token = await getToken();
    if (!token) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, slug: slugify(name, { lower: true, strict: true }), description }),
    });
    setName("");
    setDescription("");
    load();
  };

  const deleteCategory = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/categories?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <Card className="rounded-2xl">
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={createCategory}>Create</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">{item.slug}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteCategory(item.id)}>
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
