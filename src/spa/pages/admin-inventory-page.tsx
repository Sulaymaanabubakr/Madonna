import { useEffect, useState } from "react";
import { Search, AlertTriangle, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminProducts } from "@/lib/firestore-admin";
import { getDbClient } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import type { Product } from "@/types";

export function AdminInventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

    const loadInventory = async () => {
        setLoading(true);
        const data = await fetchAdminProducts();
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleStockUpdate = (id: string, newStock: number) => {
        setProducts(products.map(p => p.id === id ? { ...p, stockQty: newStock } : p));
    };

    const saveStock = async (product: Product) => {
        setSavingId(product.id);
        try {
            const db = await getDbClient();
            if (!db) return;
            await updateDoc(doc(db, "products", product.id), {
                stockQty: product.stockQty,
                updatedAt: new Date().toISOString()
            });
            toast.success(`Stock level for "${product.name}" updated successfully.`);
        } catch (err: any) {
            toast.error("Failed to update stock: " + err.message);
        } finally {
            setSavingId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const lowStockThreshold = 10;

    return (
        <div className="space-y-6 pt-4 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                <p className="text-muted-foreground mt-2">Manage the stock quantities of your available products.</p>
            </div>

            <Card className="border-t-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative flex-1 w-full sm:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products by Name or SKU..."
                                className="pl-8 bg-background w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border bg-card text-card-foreground shadow overflow-x-auto w-full">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left font-medium text-muted-foreground [&>th]:p-4 whitespace-nowrap">
                                    <th>Product Item</th>
                                    <th>SKU</th>
                                    <th>Price</th>
                                    <th>Available Stock</th>
                                    <th className="w-[120px] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y [&>tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            Loading inventory...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No products found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const stockQty = typeof product.stockQty === "number" ? product.stockQty : 0;
                                        const isLowStock = stockQty < lowStockThreshold;
                                        const isOutOfStock = stockQty === 0;

                                        return (
                                            <tr key={product.id} className="transition-colors hover:bg-muted/50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 shrink-0 bg-muted rounded overflow-hidden">
                                                            {product.images?.[0]?.url ? (
                                                                <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover mix-blend-multiply" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-secondary/50" />
                                                            )}
                                                        </div>
                                                        <div className="font-medium">
                                                            {product.name}
                                                            {isOutOfStock && <Badge variant="destructive" className="ml-2 py-0 h-5" >Out of Stock</Badge>}
                                                            {isLowStock && !isOutOfStock && <Badge variant="outline" className="ml-2 text-orange-500 border-orange-500 py-0 h-5"><AlertTriangle className="h-3 w-3 mr-1" /> Low</Badge>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-muted-foreground">
                                                    {product.sku || "—"}
                                                </td>
                                                <td className="p-4">
                                                    ₦{product.price?.toLocaleString()}
                                                </td>
                                                <td className="p-4 relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className={`w-24 ${isOutOfStock ? "border-red-500/50 bg-red-50" : isLowStock ? "border-orange-500/50 bg-orange-50" : ""}`}
                                                        value={stockQty}
                                                        onChange={(e) => handleStockUpdate(product.id, Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => saveStock(product)}
                                                        disabled={savingId === product.id}
                                                    >
                                                        {savingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
