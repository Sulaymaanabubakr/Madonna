

import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Heart, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/types";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/query";
import { ProductCard } from "@/components/store/product-card";

export function ProductDetailClient({ product }: { product: Product | null }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);

  if (!product) return <div className="container mx-auto px-4 py-32 text-center text-zinc-500">Product not found</div>;

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      qty,
      imageUrl: product.images[0]?.url || "/placeholder.svg",
      stockQty: product.stockQty,
    });
  };

  return (
    <div className="bg-white">
      <div className="border-b border-zinc-100 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
            <ChevronRight className="mx-2 h-3 w-3" />
            <Link to="/shop" className="hover:text-[#8B2030]">SHOP</Link>
            <ChevronRight className="mx-2 h-3 w-3" />
            <span className="text-zinc-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[3/4] w-full bg-[#F4F4F4]">
              <img
                src={product.images[activeImage]?.url || "/placeholder.svg"}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square w-24 shrink-0 bg-[#F4F4F4] transition-opacity hover:opacity-100 ${activeImage === idx ? "opacity-100 ring-1 ring-zinc-900" : "opacity-60"}`}
                  >
                    <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="font-serif text-3xl font-bold uppercase text-zinc-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? "fill-[#222222] text-[#222222]" : "fill-zinc-200 text-zinc-200"}`} />
                ))}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">( There are no reviews yet. )</span>
            </div>

            <div className="mt-6 flex flex-col gap-1 border-b border-zinc-200 pb-8">
              <div className="flex items-center gap-3">
                {hasDiscount && <span className="text-xl text-zinc-400 line-through">{formatCurrency(product.compareAtPrice!)}</span>}
                <span className="text-3xl font-black text-[#8B2030]">{formatCurrency(product.price)}</span>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-zinc-600">
                {product.description || "Premium quality product from Madonna Shopping Arena, curated for excellence."}
              </p>
            </div>

            <div className="mt-6">
              <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-900">Categories: </span>
              <span className="cursor-pointer text-[13px] text-zinc-500 hover:text-[#8B2030]">{product.categoryName}, Premium</span>
            </div>

            <div className="mt-8 flex items-center gap-4 border-b border-zinc-200 pb-8">
              <div className="flex h-12 w-32 items-center justify-between border border-zinc-200 bg-white px-2">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2 text-zinc-500 hover:text-zinc-900">-</button>
                <span className="text-[13px] font-bold text-zinc-900">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stockQty, q + 1))} className="px-2 text-zinc-500 hover:text-zinc-900">+</button>
              </div>
              <Button onClick={handleAdd} disabled={product.stockQty < 1} className="h-12 flex-1 rounded-none bg-[#222222] px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8B2030]">
                {product.stockQty < 1 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <button className="flex h-12 w-12 items-center justify-center border border-zinc-200 hover:bg-zinc-100">
                <Heart className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-900">Share:</span>
              <div className="flex items-center gap-3">
                <Share2 className="h-4 w-4 cursor-pointer text-zinc-600 hover:text-[#8B2030]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-[#F4F4F4] py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="flex h-auto w-full justify-start rounded-none border-b border-zinc-200 bg-transparent p-0 pb-1">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:border-[#8B2030] data-[state=active]:text-zinc-900 data-[state=active]:shadow-none">Description</TabsTrigger>
              <TabsTrigger value="additional" className="rounded-none border-b-2 border-transparent px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:border-[#8B2030] data-[state=active]:text-zinc-900 data-[state=active]:shadow-none">Additional Information</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:border-[#8B2030] data-[state=active]:text-zinc-900 data-[state=active]:shadow-none">Reviews (0)</TabsTrigger>
            </TabsList>
            <div className="bg-white p-8 shadow-sm">
              <TabsContent value="description" className="mt-0 text-[13px] leading-loose text-zinc-600">
                {product.description || "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </TabsContent>
              <TabsContent value="additional" className="mt-0 text-[13px] leading-loose text-zinc-600">Weight: N/A <br /> Dimensions: N/A</TabsContent>
              <TabsContent value="reviews" className="mt-0 text-[13px] leading-loose text-zinc-600">There are no reviews yet. Be the first to review this product.</TabsContent>
            </div>
          </Tabs>

          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-xl font-bold uppercase tracking-widest text-zinc-900">Related Products</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <ProductCard product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
