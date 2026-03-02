

import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Grid, List, Search } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts } from "@/lib/firestore";
import type { Product } from "@/types";

const categories = [
  { id: "all", name: "All" },
  { id: "fashion-accessories", name: "Fashion & Accessories" },
  { id: "beauty-personal-care", name: "Beauty & Personal Care" },
  { id: "foodstuff-groceries", name: "Foodstuff & Groceries" },
];

export function ShopPageClient({
  initialItems,
  initialTotalPages,
  initialQuery,
  initialCategory,
  initialSort,
  initialPage,
}: {
  initialItems: Product[];
  initialTotalPages: number;
  initialQuery: string;
  initialCategory: string;
  initialSort: string;
  initialPage: number;
}) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const firstRun = useRef(true);

  const filters = useMemo(
    () => ({ q, category: category !== "all" ? category : "", sort, page, pageSize: 12 }),
    [q, category, sort, page],
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setLoading(true);
    fetchProducts(filters)
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="bg-[#F4F4F4]">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">
              {categories.find((c) => c.id === category)?.name || "SHOP"}
            </h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">SHOP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <aside className="w-full lg:w-64 lg:shrink-0">
            <div className="mb-8">
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-zinc-900">Product Categories</h3>
              <div className="mb-6 h-[2px] w-[50px] bg-zinc-200" />
              <ul className="space-y-4">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setCategory(cat.id); setPage(1); }}
                      className={`flex w-full items-center justify-between text-left text-[13px] font-semibold transition-colors hover:text-[#8B2030] ${category === cat.id ? "text-[#8B2030]" : "text-zinc-600"}`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8 border-t border-zinc-200 pt-8">
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-zinc-900">Search Shop</h3>
              <div className="mb-6 h-[2px] w-[50px] bg-zinc-200" />
              <div className="flex gap-0 shadow-sm">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Keyword..."
                  className="h-10 rounded-none border-none text-[13px]"
                />
                <Button onClick={() => setPage(1)} className="h-10 rounded-none bg-[#8B2030] px-4 hover:bg-[#721a27]">
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <button className="text-zinc-900"><Grid className="h-5 w-5" /></button>
                <button className="text-zinc-400 hover:text-zinc-900"><List className="h-5 w-5" /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-500">Sort by:</span>
                <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
                  <SelectTrigger className="h-9 w-40 rounded-none border-zinc-300 text-[12px]">
                    <SelectValue placeholder="Default sorting" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="new">Newness</SelectItem>
                    <SelectItem value="best">Popularity</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-none" />)}
              </div>
            ) : items.length ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-[13px] text-zinc-500">No products found matching your selection.</p>
                <Button
                  className="mt-8 rounded-none bg-[#8B2030] text-xs font-bold uppercase tracking-widest text-white hover:bg-[#721a27]"
                  onClick={() => { setQ(""); setCategory("all"); }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center border-t border-zinc-200 pt-8">
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex h-10 w-10 items-center justify-center border border-zinc-300 bg-white text-zinc-900 transition-colors hover:bg-[#8B2030] hover:text-white disabled:opacity-50">{"<"}</button>
                  <span className="flex h-10 w-10 items-center justify-center border border-[#8B2030] bg-[#8B2030] text-xs font-bold text-white">{page}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex h-10 w-10 items-center justify-center border border-zinc-300 bg-white text-zinc-900 transition-colors hover:bg-[#8B2030] hover:text-white disabled:opacity-50">{">"}</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
