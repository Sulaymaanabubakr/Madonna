export type UserRole = "admin" | "customer";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
};

export type ProductImage = {
  publicId: string;
  url: string;
  alt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryName: string;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  images: ProductImage[];
  stockQty: number;
  sku: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl: string;
  stockQty: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  orderNumber: string;
  userId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    notes?: string;
  };
  payment: {
    provider: "paystack";
    reference: string;
    status: "paid" | "unpaid";
    paidAt?: string;
  };
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type StatusEvent = {
  status: OrderStatus;
  note?: string;
  createdAt: string;
};

export type StoreSettings = {
  storeName: string;
  storeAddress: string;
  phone: string;
  email: string;
  whatsapp: string;
  deliveryFee: number;
  updatedAt: string;
};
