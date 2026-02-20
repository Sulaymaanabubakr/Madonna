import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "new";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "12");

  const snapshot = await adminDb.collection("products").where("isActive", "==", true).get();
  let products: Array<Record<string, unknown>> = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  }));

  if (q) {
    products = products.filter((p) =>
      `${p.name ?? ""} ${p.description ?? ""} ${(p.tags as string[] | undefined)?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }

  if (category) {
    products = products.filter((p) => p.categoryId === category || p.categoryName === category || p.slug === category);
  }

  products = products.sort((a, b) => {
    if (sort === "price-asc") return Number(a.price) - Number(b.price);
    if (sort === "price-desc") return Number(b.price) - Number(a.price);
    if (sort === "best") return Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller));
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  const total = products.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return NextResponse.json({
    items: products.slice(start, end),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
