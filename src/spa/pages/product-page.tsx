import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductDetailClient } from "@/components/store/product-detail-client";
import { fetchProducts } from "@/lib/firestore";
import type { Product } from "@/types";

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) {
      setProduct(null);
      return;
    }

    fetchProducts({ slug, pageSize: 1 })
      .then((data) => {
        setProduct(data.items.length ? data.items[0] : null);
      })
      .catch(() => setProduct(null));
  }, [slug]);

  return <ProductDetailClient product={product} />;
}
