import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { fetchProducts } from "@/lib/firestore";
import type { Product } from "@/types";

export function WishlistPage() {
    const { ids, clear } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (ids.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }

        fetchProducts({ pageSize: 200 })
            .then((data) => setProducts(data.items.filter((p) => ids.includes(p.id))))
            .finally(() => setLoading(false));
    }, [ids]);

    return (
        <div className="bg-[#F4F4F4] pb-24">
            <div className="border-b border-zinc-200 bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">WISHLIST</h1>
                        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
                            <ChevronRight className="mx-2 h-3 w-3" />
                            <span className="text-zinc-900">WISHLIST</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] animate-pulse bg-zinc-200" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="border border-zinc-200 bg-white p-12 text-center">
                        <p className="text-[13px] text-zinc-500">Your wishlist is empty.</p>
                        <Button asChild className="mt-6 rounded-none bg-[#8B2030] text-xs font-bold uppercase tracking-widest text-white hover:bg-[#721a27]">
                            <Link to="/shop">Browse Products</Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">{products.length} item{products.length !== 1 ? "s" : ""}</p>
                            <Button
                                variant="outline"
                                className="h-9 rounded-none border-zinc-300 text-[10px] font-bold uppercase tracking-widest"
                                onClick={() => clear()}
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Clear All
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
