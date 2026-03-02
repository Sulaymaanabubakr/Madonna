import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ImagePlus, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getDbClient } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import type { Product, ProductImage } from "@/types";

export function AdminProductEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const isNew = !id;
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<Product>>({
        name: "",
        slug: "",
        description: "",
        price: 0,
        compareAtPrice: 0,
        categoryId: "",
        categoryName: "",
        tags: [],
        featured: false,
        bestSeller: false,
        newArrival: false,
        isActive: true,
        stockQty: 0,
        sku: "",
        images: []
    });

    useEffect(() => {
        if (!isNew && id) {
            const loadProduct = async () => {
                try {
                    const db = await getDbClient();
                    if (!db) return;
                    const docSnap = await getDoc(doc(db, "products", id));
                    if (docSnap.exists()) {
                        setFormData(docSnap.data() as Product);
                    } else {
                        toast.error("Product not found");
                        navigate("/admin/products");
                    }
                } catch (err) {
                    toast.error("Failed to load product");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            loadProduct();
        }
    }, [id, isNew, navigate]);

    const handleGenerateSlug = () => {
        if (!formData.name) return;
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const token = await getToken();
                toast.loading("Uploading image...", { id: "upload" });
                const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ image: base64 })
                });

                if (!res.ok) throw new Error("Upload failed");
                const { url, publicId } = await res.json();

                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), { url, publicId, alt: prev.name || "Product Image" }]
                }));
                toast.success("Image uploaded", { id: "upload" });
            } catch (err) {
                toast.error("Image upload failed", { id: "upload" });
                console.error(err);
            }
        };
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const db = await getDbClient();
            if (!db) throw new Error("Firebase not initialized");

            const productData = {
                ...formData,
                updatedAt: new Date().toISOString()
            };

            if (isNew) {
                productData.createdAt = new Date().toISOString();
                const newDocRef = doc(collection(db, "products"));
                await setDoc(newDocRef, { ...productData, id: newDocRef.id });
            } else if (id) {
                await updateDoc(doc(db, "products", id), productData);
            }

            toast.success(`Product ${isNew ? 'created' : 'updated'} successfully`);
            navigate("/admin/products");
        } catch (err: any) {
            toast.error("Failed to save product: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-20 text-center text-muted-foreground">Loading product...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-6 pt-4 pb-12 w-full max-w-4xl max-w-[100vw]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={() => navigate("/admin/products")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Create Product" : "Edit Product"}</h1>
                        <p className="text-muted-foreground">{isNew ? "Add a new product to your store." : "Update product details and variations."}</p>
                    </div>
                </div>
                <Button type="submit" disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    Save Product
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                    {/* General Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Product Name *</label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onBlur={handleGenerateSlug} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug *</label>
                                <Input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea className="min-h-[150px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing and Inventory */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Price (₦) *</label>
                                <Input type="number" required min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Compare at Price (₦)</label>
                                <Input type="number" min="0" value={formData.compareAtPrice} onChange={e => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SKU</label>
                                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Stock Quantity *</label>
                                <Input type="number" required min="0" value={formData.stockQty} onChange={e => setFormData({ ...formData, stockQty: Number(e.target.value) })} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                            <CardDescription>Upload product images. The first image will be the main thumbnail.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {formData.images?.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-md border bg-zinc-100 overflow-hidden group">
                                        <img src={img.url} alt="Product" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-2 right-2 bg-background/80 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-square rounded-md border border-dashed hover:bg-muted/50 cursor-pointer transition-colors">
                                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground font-medium">Upload Image</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Organization & Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category Name</label>
                                <Input value={formData.categoryName} onChange={e => setFormData({ ...formData, categoryName: e.target.value })} placeholder="e.g. Health & Beauty" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category ID (Optional)</label>
                                <Input value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} />
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(val) => setFormData({ ...formData, isActive: !!val })} />
                                    <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Active (Visible in store)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="featured" checked={formData.featured} onCheckedChange={(val) => setFormData({ ...formData, featured: !!val })} />
                                    <label htmlFor="featured" className="text-sm leading-none">Featured Product</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="bestSeller" checked={formData.bestSeller} onCheckedChange={(val) => setFormData({ ...formData, bestSeller: !!val })} />
                                    <label htmlFor="bestSeller" className="text-sm leading-none">Best Seller</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="newArrival" checked={formData.newArrival} onCheckedChange={(val) => setFormData({ ...formData, newArrival: !!val })} />
                                    <label htmlFor="newArrival" className="text-sm leading-none">New Arrival</label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
