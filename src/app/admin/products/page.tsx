"use client";

import { useEffect, useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function uploadToCloudinary(file: File) {
  const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
  const signData = await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", String(signData.timestamp));
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);

  const upload = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  return upload.json();
}

export default function AdminProductsPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    price: 0,
    stockQty: 0,
    sku: "",
    categoryId: "",
    categoryName: "",
    featured: false,
    bestSeller: false,
    newArrival: false,
    isActive: true,
    tags: [],
    images: [],
  });

  const load = async () => {
    const token = await getToken();
    if (!token) return;

    const [productsRes, categoriesRes] = await Promise.all([
      fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    setItems((await productsRes.json()).items || []);
    setCategories((await categoriesRes.json()).items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const token = await getToken();
    if (!token) return;

    if (!form.images.length) {
      toast.error("Upload at least one image");
      return;
    }

    const payload = {
      ...form,
      slug: slugify(form.name, { lower: true, strict: true }),
      tags: form.tags || [],
    };

    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    setForm({
      name: "",
      description: "",
      price: 0,
      stockQty: 0,
      sku: "",
      categoryId: "",
      categoryName: "",
      featured: false,
      bestSeller: false,
      newArrival: false,
      isActive: true,
      tags: [],
      images: [],
    });

    load();
  };

  const remove = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>

      <Card className="rounded-2xl">
        <CardContent className="grid gap-3 p-5 md:grid-cols-2">
          <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Textarea className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input type="number" placeholder="Stock Qty" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={form.categoryId}
            onChange={(e) => {
              const selected = categories.find((cat) => cat.id === e.target.value);
              setForm({ ...form, categoryId: e.target.value, categoryName: selected?.name || "" });
            }}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <Input placeholder="Comma separated tags" onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />

          <div className="md:col-span-2">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const uploaded = await uploadToCloudinary(file);
                setForm((prev: any) => ({
                  ...prev,
                  images: [...prev.images, { publicId: uploaded.public_id, url: uploaded.secure_url, alt: prev.name || "Product image" }],
                }));
                toast.success("Image uploaded");
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">Uploaded: {form.images.length}</p>
          </div>

          <div className="flex gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: Boolean(v) })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.bestSeller} onCheckedChange={(v) => setForm({ ...form, bestSeller: Boolean(v) })} /> Best Seller</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.newArrival} onCheckedChange={(v) => setForm({ ...form, newArrival: Boolean(v) })} /> New Arrival</label>
          </div>

          <Button className="md:col-span-2" onClick={submit}>Create Product</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-2 p-5">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">SKU: {item.sku} | Stock: {item.stockQty}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => remove(item.id)}>Delete</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
