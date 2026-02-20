import "dotenv/config";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../src/lib/firebase/admin";
import { CATEGORIES_SEED } from "../src/lib/constants";

async function seed() {
  const now = new Date().toISOString();

  const categoryIds: Record<string, string> = {};
  for (const category of CATEGORIES_SEED) {
    const ref = adminDb.collection("categories").doc();
    categoryIds[category.slug] = ref.id;
    await ref.set({
      id: ref.id,
      ...category,
      createdAt: now,
      createdAtServer: FieldValue.serverTimestamp(),
    });
  }

  const demoProducts = [
    {
      name: "Premium Casual Sneakers",
      slug: "premium-casual-sneakers",
      description: "Stylish and comfortable sneakers for everyday wear.",
      price: 38000,
      compareAtPrice: 42000,
      categoryId: categoryIds["fashion-accessories"],
      categoryName: "Fashion & Accessories",
      tags: ["shoes", "fashion"],
      featured: true,
      bestSeller: true,
      newArrival: false,
      images: [
        {
          publicId: "sample-fashion",
          url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
          alt: "Premium Casual Sneakers",
        },
      ],
      stockQty: 24,
      sku: "FASH-SHOE-001",
      isActive: true,
    },
    {
      name: "Luxury Body Cream",
      slug: "luxury-body-cream",
      description: "Hydrating body cream with long-lasting fragrance.",
      price: 9500,
      categoryId: categoryIds["beauty-personal-care"],
      categoryName: "Beauty & Personal Care",
      tags: ["beauty", "cream"],
      featured: true,
      bestSeller: false,
      newArrival: true,
      images: [
        {
          publicId: "sample-beauty",
          url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
          alt: "Luxury Body Cream",
        },
      ],
      stockQty: 40,
      sku: "BEAU-CREAM-001",
      isActive: true,
    },
    {
      name: "Premium Local Rice (10kg)",
      slug: "premium-local-rice-10kg",
      description: "Clean, stone-free Nigerian rice for family meals.",
      price: 31000,
      categoryId: categoryIds["foodstuff-groceries"],
      categoryName: "Foodstuff & Groceries",
      tags: ["rice", "groceries"],
      featured: true,
      bestSeller: true,
      newArrival: true,
      images: [
        {
          publicId: "sample-food",
          url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
          alt: "Premium Local Rice",
        },
      ],
      stockQty: 35,
      sku: "FOOD-RICE-001",
      isActive: true,
    },
  ];

  for (const product of demoProducts) {
    const ref = adminDb.collection("products").doc();
    await ref.set({
      id: ref.id,
      ...product,
      createdAt: now,
      updatedAt: now,
      createdAtServer: FieldValue.serverTimestamp(),
      updatedAtServer: FieldValue.serverTimestamp(),
    });
  }

  await adminDb.collection("settings").doc("store").set({
    storeName: "Madonna Link Express Ventures",
    storeAddress: "21/22 Akinosho Street, Off Afariogun, Along Airport Road, Oshodi, Lagos, Nigeria",
    phone: "07063006033",
    email: "madonnaexpresslinkventure@gmail.com",
    whatsapp: "2347063006033",
    deliveryFee: 2000,
    updatedAt: now,
    updatedAtServer: FieldValue.serverTimestamp(),
  });

  console.log("Seed complete");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
