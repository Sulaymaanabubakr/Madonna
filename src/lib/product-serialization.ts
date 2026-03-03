import type { Product } from "../types";

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }
  }
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBooleanValue(value: unknown): boolean {
  return Boolean(value);
}

export function serializeProduct(id: string, raw: Record<string, unknown>): Product {
  const imagesRaw = Array.isArray(raw.images) ? raw.images : [];

  const images = imagesRaw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      publicId: toStringValue(item.publicId, ""),
      url: toStringValue(item.url, ""),
      alt: toStringValue(item.alt, ""),
    }))
    .filter((img) => img.url.length > 0);

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => toStringValue(tag, "")).filter(Boolean)
    : [];

  const compareAtPrice = toNumberValue(raw.compareAtPrice, NaN);

  return {
    id,
    name: toStringValue(raw.name, ""),
    slug: toStringValue(raw.slug, ""),
    description: toStringValue(raw.description, ""),
    price: toNumberValue(raw.price, 0),
    compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : undefined,
    categoryId: toStringValue(raw.categoryId, ""),
    categoryName: toStringValue(raw.categoryName, ""),
    tags,
    featured: toBooleanValue(raw.featured),
    bestSeller: toBooleanValue(raw.bestSeller),
    newArrival: toBooleanValue(raw.newArrival),
    images,
    stockQty: Math.max(0, Math.floor(toNumberValue(raw.stockQty, 0))),
    sku: toStringValue(raw.sku, ""),
    isActive: toBooleanValue(raw.isActive),
    createdAt: toStringValue(raw.createdAt, ""),
    updatedAt: toStringValue(raw.updatedAt, ""),
  };
}
