"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeProduct = serializeProduct;
function toStringValue(value, fallback) {
    if (fallback === void 0) { fallback = ""; }
    if (typeof value === "string")
        return value;
    if (typeof value === "number" || typeof value === "boolean")
        return String(value);
    if (value && typeof value === "object") {
        var maybeTimestamp = value;
        if (typeof maybeTimestamp.toDate === "function") {
            return maybeTimestamp.toDate().toISOString();
        }
    }
    return fallback;
}
function toNumberValue(value, fallback) {
    if (fallback === void 0) { fallback = 0; }
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function toBooleanValue(value) {
    return Boolean(value);
}
function serializeProduct(id, raw) {
    var imagesRaw = Array.isArray(raw.images) ? raw.images : [];
    var images = imagesRaw
        .map(function (item) { return (item && typeof item === "object" ? item : null); })
        .filter(function (item) { return Boolean(item); })
        .map(function (item) { return ({
        publicId: toStringValue(item.publicId, ""),
        url: toStringValue(item.url, ""),
        alt: toStringValue(item.alt, ""),
    }); })
        .filter(function (img) { return img.url.length > 0; });
    var tags = Array.isArray(raw.tags)
        ? raw.tags.map(function (tag) { return toStringValue(tag, ""); }).filter(Boolean)
        : [];
    var compareAtPrice = toNumberValue(raw.compareAtPrice, NaN);
    return {
        id: id,
        name: toStringValue(raw.name, ""),
        slug: toStringValue(raw.slug, ""),
        description: toStringValue(raw.description, ""),
        price: toNumberValue(raw.price, 0),
        compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : undefined,
        categoryId: toStringValue(raw.categoryId, ""),
        categoryName: toStringValue(raw.categoryName, ""),
        tags: tags,
        featured: toBooleanValue(raw.featured),
        bestSeller: toBooleanValue(raw.bestSeller),
        newArrival: toBooleanValue(raw.newArrival),
        images: images,
        stockQty: Math.max(0, Math.floor(toNumberValue(raw.stockQty, 0))),
        sku: toStringValue(raw.sku, ""),
        isActive: toBooleanValue(raw.isActive),
        createdAt: toStringValue(raw.createdAt, ""),
        updatedAt: toStringValue(raw.updatedAt, ""),
    };
}
