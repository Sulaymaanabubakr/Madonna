import "dotenv/config";
import slugify from "slugify";
import { adminDb } from "../src/lib/firebase/admin";
import { BUSINESS, CATEGORIES_SEED } from "../src/lib/constants";

async function seedCategories() {
  const categoryIds: Record<string, string> = {};

  for (const category of CATEGORIES_SEED) {
    const existing = await adminDb
      .collection("categories")
      .where("slug", "==", category.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      categoryIds[category.slug] = existing.docs[0].id;
      continue;
    }

    const ref = adminDb.collection("categories").doc();
    await ref.set({
      id: ref.id,
      ...category,
      createdAt: new Date().toISOString(),
    });
    categoryIds[category.slug] = ref.id;
  }

  return categoryIds;
}

async function seedProducts(categoryIds: Record<string, string>) {
  const samples = [
    {
      name: "Premium Handbag",
      categorySlug: "fashion-accessories",
      description: "Elegant premium handbag suitable for daily use and special outings.",
      price: 18500,
      stockQty: 25,
    },
    {
      name: "Body Lotion Set",
      categorySlug: "beauty-personal-care",
      description: "Hydrating lotion set with long-lasting fragrance for all skin types.",
      price: 9200,
      stockQty: 40,
    },
    {
      name: "Family Grocery Pack",
      categorySlug: "foodstuff-groceries",
      description: "Essential weekly grocery bundle for small households.",
      price: 26500,
      stockQty: 15,
    },
  ];

  for (const sample of samples) {
    const slug = slugify(sample.name, { lower: true, strict: true });
    const exists = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
    if (!exists.empty) continue;

    const category = CATEGORIES_SEED.find((item) => item.slug === sample.categorySlug);
    const categoryId = categoryIds[sample.categorySlug];
    if (!category || !categoryId) continue;

    const ref = adminDb.collection("products").doc();
    const now = new Date().toISOString();

    await ref.set({
      id: ref.id,
      name: sample.name,
      slug,
      description: sample.description,
      price: sample.price,
      compareAtPrice: sample.price + 2500,
      categoryId,
      categoryName: category.name,
      tags: category.name.toLowerCase().split(" "),
      featured: true,
      bestSeller: sample.categorySlug === "fashion-accessories",
      newArrival: true,
      images: [
        {
          publicId: "",
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
          alt: sample.name,
        },
      ],
      stockQty: sample.stockQty,
      sku: `SKU-${ref.id.slice(0, 8).toUpperCase()}`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function seedSettings() {
  await adminDb.collection("settings").doc("store").set(
    {
      storeName: BUSINESS.name,
      storeAddress: BUSINESS.address,
      phone: BUSINESS.phone,
      email: BUSINESS.email,
      whatsapp: BUSINESS.whatsapp,
      deliveryFee: 2000,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

async function run() {
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedSettings();
  console.log("Seed complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
