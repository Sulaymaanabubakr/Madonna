import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { fetchAdminProducts, toggleProductStatus } from "@/lib/firestore-admin";
import type { Product } from "@/types";

export function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadProducts = async () => {
        setLoading(true);
        const data = await fetchAdminProducts();
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleToggleStatus = async (product: Product) => {
        const success = await toggleProductStatus(product.id, product.isActive);
        if (success) {
            toast.success(`Product marked as ${product.isActive ? "Draft" : "Active"}`);
            setProducts(products.map(p => p.id === product.id ? { ...p, isActive: !product.isActive } : p));
        } else {
            toast.error("Failed to update status");
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const lower = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.sku?.toLowerCase().includes(lower) ||
            p.categoryName?.toLowerCase().includes(lower)
        );
    }, [products, searchQuery]);

    return (
        <div className="space-y-6 pt-4 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground mt-2">Manage inventory, pricing, and visibility.</p>
                </div>
                <Button asChild>
                    <Link to="/admin/products/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Product
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Products</CardTitle>
                    <CardDescription>View and manage all your store products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1 w-full sm:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto w-full">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left font-medium text-muted-foreground [&>th]:p-4 [&>th]:align-middle">
                                    <th className="w-[80px]">Image</th>
                                    <th>Name & SKU</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th className="w-[80px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr:last-child]:border-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-muted-foreground py-8">
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-muted-foreground py-8">
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="h-12 w-12 rounded-md border bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {product.images?.[0]?.url ? (
                                                        <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover mix-blend-multiply" />
                                                    ) : typeof product.images?.[0] === 'string' ? (
                                                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover mix-blend-multiply" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{product.name}</div>
                                                {product.sku && <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>}
                                            </td>
                                            <td className="p-4">{product.categoryName || "Uncategorized"}</td>
                                            <td className="p-4">
                                                <Badge variant={product.isActive ? "default" : "secondary"}>
                                                    {product.isActive ? "Active" : "Draft"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-mono font-medium">₦{(product.price || 0).toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={product.stockQty <= 5 ? "text-destructive font-medium" : ""}>
                                                    {product.stockQty || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/admin/products/${product.id}`} className="flex items-center">
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                                                            {product.isActive ? "Mark as Draft" : "Mark as Active"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                                            // For this simple version, soft delete is just setting isActive to false.
                                                            if (product.isActive) handleToggleStatus(product);
                                                            toast.success("Product moved to draft (soft deleted).");
                                                        }}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Soft Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
