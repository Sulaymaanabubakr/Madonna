import { useEffect, useMemo, useState } from "react";
import { HomePageClient } from "@/components/store/home-page-client";
import type { Product } from "@/types";

function sortByCreatedAtDesc(a: Product, b: Product) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

export function HomePage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?page=1&pageSize=40")
      .then((r) => r.json())
      .then((data) => {
        setItems((data.items as Product[]) || []);
      })
      .catch(() => setItems([]));
  }, []);

  const bestSellers = useMemo(() => items.filter((p) => p.bestSeller).sort(sortByCreatedAtDesc).slice(0, 4), [items]);
  const newArrivals = useMemo(() => items.filter((p) => p.newArrival).sort(sortByCreatedAtDesc).slice(0, 4), [items]);

  return <HomePageClient bestSellers={bestSellers} newArrivals={newArrivals} />;
}
