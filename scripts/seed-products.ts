import * as dotenv from "dotenv";
dotenv.config();

function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const templates = [
    // Shoes (15 items)
    ...Array.from({ length: 15 }).map((_, i) => ({
        name: `Premium Leather Sneaker Vol ${i + 1}`, categoryId: "shoes", categoryName: "Shoes", price: 15000 + (i * 1000)
    })),
    // Clothes (15 items)
    ...Array.from({ length: 15 }).map((_, i) => ({
        name: `Ankara Print Dress Design ${String.fromCharCode(65 + i)}`, categoryId: "clothing", categoryName: "Clothing", price: 8000 + (i * 500)
    })),
    // Hand/Body Creams (5 items)
    { name: "Shea Butter Body Cream", categoryId: "beauty", categoryName: "Health & Beauty", price: 3500 },
    { name: "Cocoa Butter Hand Lotion", categoryId: "beauty", categoryName: "Health & Beauty", price: 2800 },
    { name: "Aloe Vera Skin Soothing Gel", categoryId: "beauty", categoryName: "Health & Beauty", price: 4000 },
    { name: "Vitamin C Brightening Lotion", categoryId: "beauty", categoryName: "Health & Beauty", price: 5500 },
    { name: "Organic Coconut Body Oil", categoryId: "beauty", categoryName: "Health & Beauty", price: 3200 },
    // Body Spray / Hair Spray (5 items)
    { name: "Midnight Musk Body Spray", categoryId: "beauty", categoryName: "Health & Beauty", price: 4500 },
    { name: "Floral Bloom Perfume Mist", categoryId: "beauty", categoryName: "Health & Beauty", price: 5000 },
    { name: "Argan Oil Hair Spray", categoryId: "beauty", categoryName: "Health & Beauty", price: 3800 },
    { name: "Ocean Breeze Deodorant", categoryId: "beauty", categoryName: "Health & Beauty", price: 2500 },
    { name: "Edge Control Hair Gel", categoryId: "beauty", categoryName: "Health & Beauty", price: 2000 },
    // Costume Jewelry (10 items)
    ...Array.from({ length: 10 }).map((_, i) => ({
        name: `Gold Plated Chain Style ${i + 1}`, categoryId: "jewelry", categoryName: "Jewelry", price: 5000 + (i * 200)
    })),
    // Food Stuffs (50 items)
    ...[
        "Ofada Rice (Paint)", "Long Grain Parboiled Rice (Bag)", "Basmati Rice (Box)", "Local Brown Rice", "Foreign White Rice",
        "Honey Beans (Oloyin) - Paint", "Iron Beans - Paint", "White Beans - Paint", "Brown Beans", "Pigeon Pea (Fio Fio)",
        "Ijebu Garri (Paint)", "White Garri (Paint)", "Yellow Garri", "Cassava Flakes (Abacha) Large", "Cassava Flakes Small",
        "Grinded Ogbono (Derica)", "Whole Ogbono Seeds", "Grinded Egusi (Derica)", "Whole Egusi Seeds", "Peeled Egusi",
        "Grinded Dry Pepper (Jar)", "Cameroon Pepper", "Whole Dry Pepper", "Scotch Bonnet Powder", "Cayenne Pepper Mix",
        "Dry Catfish (Large)", "Smoked Round Fish", "Stockfish (Okporoko) Cuts", "Stockfish Head", "Smoked Mangala Fish",
        "Crayfish (Blended - Derica)", "Whole Crayfish", "Dry Prawns", "Smoked Shrimps", "Bonga Fish",
        "Yam Flour (Elubo) - Paint", "Plantain Flour", "Wheat Flour", "Bambara Nut Flour (Okpa)", "Bean Flour (Akara mix)",
        "Red Palm Oil (4 Litres)", "Vegetable Oil (4 Litres)", "Groundnut Oil", "Soya Oil", "Coconut Oil (Cooking)",
        "Curry Powder & Thyme Set", "Suya Spice Mix (Yaji)", "Mixed Herbs Seasoning", "Ginger & Garlic Paste", "Chicken Seasoning Cubes",
    ].map(name => ({
        name, categoryId: "food", categoryName: "Groceries & Food", price: 1500 + Math.floor(Math.random() * 8000)
    }))
];

async function seed100() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    console.log("Starting 100-product seed process for true project ID:", process.env.FIREBASE_PROJECT_ID);

    // First clean up previous products so the db isn't polluted
    console.log("Cleaning up old products...");
    const oldSnaps = await adminDb.collection("products").get();
    const deleteBatch = adminDb.batch();
    oldSnaps.docs.forEach((doc: any) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log("Old products cleared.");

    // Generate the new ones in chunks (Firestore limits batches to 500 ops)
    let batch = adminDb.batch();
    let count = 0;

    for (let i = 0; i < templates.length; i++) {
        const item = templates[i];
        const docRef = adminDb.collection("products").doc();
        const sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const slug = generateSlug(item.name) + "-" + Math.random().toString(36).substring(2, 6);

        batch.set(docRef, {
            id: docRef.id,
            name: item.name,
            slug: slug,
            description: `Premium quality ${item.name} sourced directly for Madonna Shopping Arena. Authentic and top grade.`,
            price: item.price,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            tags: [item.categoryId, item.categoryName.toLowerCase().split(' ')[0]],
            featured: count < 10,
            bestSeller: count >= 10 && count < 25,
            newArrival: count >= 25 && count < 40,
            images: [
                {
                    url: `https://loremflickr.com/600/600/${item.categoryId}?lock=${count + 1}`,
                    publicId: `dummy_${docRef.id}`, // the frontend expects this property
                    alt: item.name
                }
            ],
            stockQty: 50 + Math.floor(Math.random() * 100),
            sku: sku,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        count++;

        if (count % 50 === 0) {
            await batch.commit();
            console.log(`Committed ${count} products...`);
            batch = adminDb.batch();
        }
    }

    if (count % 50 !== 0) {
        await batch.commit();
        console.log(`Committed final batch, total: ${count}`);
    }

    console.log("Successfully seeded 100 distinct real items!");
    process.exit(0);
}

seed100().catch(err => {
    console.error(err);
    process.exit(1);
});
