import { useEffect, useMemo, useState } from "react";
import { HomePageClient } from "@/components/store/home-page-client";
import { fetchProducts } from "@/lib/firestore";
import type { Product } from "@/types";

function sortByCreatedAtDesc(a: Product, b: Product) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

export function HomePage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 150 })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  const bestSellers = useMemo(() => items.filter((p) => p.bestSeller).sort(sortByCreatedAtDesc).slice(0, 4), [items]);
  const newArrivals = useMemo(() => items.filter((p) => p.newArrival).sort(sortByCreatedAtDesc).slice(0, 4), [items]);

  return <HomePageClient bestSellers={bestSellers} newArrivals={newArrivals} />;
}
