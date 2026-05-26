export type ProductCategory =
  | "aviator"
  | "rectangular"
  | "round"
  | "cat-eye";

export type ProductMaterial = "titanium" | "bio-acetate" | "gold-plated";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: ProductCategory;
  material: ProductMaterial;
  colors: string[];
  sizes: string[];
  images: string[];
  featured?: boolean;
  collection?: string;
}

export type OrderStatus =
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  items: number;
  total: number;
  status: OrderStatus;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  orders: number;
  avatar: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}
