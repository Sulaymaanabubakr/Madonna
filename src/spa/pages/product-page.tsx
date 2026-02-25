import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductDetailClient } from "@/components/store/product-detail-client";
import type { Product } from "@/types";

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      return;
    }

    fetch(`/api/products?slug=${encodeURIComponent(slug)}&pageSize=1`)
      .then((r) => r.json())
      .then((data) => {
        const item = Array.isArray(data.items) ? (data.items[0] as Product | undefined) : undefined;
        setProduct(item || null);
      })
      .catch(() => setProduct(null));
  }, [slug]);

  return <ProductDetailClient product={product} />;
}
