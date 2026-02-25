import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopPageClient } from "@/components/store/shop-page-client";

export function ShopPage() {
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialSort = searchParams.get("sort") || "new";
  const initialPage = Number(searchParams.get("page") || "1");

  const key = useMemo(
    () => `${initialQuery}|${initialCategory}|${initialSort}|${initialPage}`,
    [initialCategory, initialPage, initialQuery, initialSort],
  );

  return (
    <ShopPageClient
      key={key}
      initialItems={[]}
      initialTotalPages={1}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialSort={initialSort}
      initialPage={Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1}
    />
  );
}
