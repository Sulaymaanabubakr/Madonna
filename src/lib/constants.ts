export const BUSINESS = {
  name: "Madonna Link Express Ventures",
  landmark: "Madonna Shopping Arena",
  address:
    "21/22 Akinosho Street, Off Afariogun, Along Airport Road, Oshodi, Lagos, Nigeria",
  phone: "07063006033",
  email: "madonnaexpresslinkventure@gmail.com",
  whatsapp: "2347063006033",
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const CATEGORIES_SEED = [
  {
    name: "Fashion & Accessories",
    slug: "fashion-accessories",
    description: "Shoes, clothes, hand band, costume jewelry",
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "body creams, body spray, hair spray",
  },
  {
    name: "Foodstuff & Groceries",
    slug: "foodstuff-groceries",
    description:
      "Rice, Beans, Garri, Palm oil, grounded spices, herbs, yam flour, okpa and lots more",
  },
];
