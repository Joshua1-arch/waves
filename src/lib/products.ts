import type { Product } from "./types";

export const products: Product[] = [
  {
    id: "1",
    slug: "aeterna-01",
    name: "Aeterna 01",
    price: 540,
    description:
      "Thin gold-rimmed rectangular frames resting on architectural stone. Precision wire construction for the discerning eye.",
    category: "rectangular",
    material: "gold-plated",
    colors: ["Gold", "Champagne"],
    sizes: ["48", "50", "52"],
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
    collection: "The 2024 Collection",
  },
  {
    id: "2",
    slug: "modulus-arc",
    name: "Modulus Arc",
    price: 480,
    description:
      "Translucent amber acetate with geometric shadow play. A study in material warmth and structural clarity.",
    category: "rectangular",
    material: "bio-acetate",
    colors: ["Amber", "Honey"],
    sizes: ["48", "50"],
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80"],
    featured: true,
  },
  {
    id: "3",
    slug: "monolith-slim",
    name: "Monolith Slim",
    price: 620,
    description:
      "Dark thick-rimmed frames with dramatic architectural lighting. Bold presence, refined silhouette.",
    category: "rectangular",
    material: "bio-acetate",
    colors: ["Onyx Black", "Graphite"],
    sizes: ["50", "52"],
    images: [
      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    id: "4",
    slug: "oxide-rigid",
    name: "Oxide Rigid",
    price: 510,
    description:
      "Matte black frames with sharp diagonal shadow. Engineered for structural rigidity and visual weight.",
    category: "rectangular",
    material: "titanium",
    colors: ["Matte Black"],
    sizes: ["48", "50", "52"],
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "5",
    slug: "golden-ratio",
    name: "Golden Ratio",
    price: 890,
    description:
      "Aviator-inspired gold wire frames on reflective surfaces. Proportions derived from classical geometry.",
    category: "aviator",
    material: "gold-plated",
    colors: ["Gold"],
    sizes: ["50", "52"],
    images: ["https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "6",
    slug: "biome-04",
    name: "Biome 04",
    price: 390,
    description:
      "Forest green acetate with slatted light patterns. Organic material, architectural form.",
    category: "rectangular",
    material: "bio-acetate",
    colors: ["Forest Green"],
    sizes: ["48", "50"],
    images: ["https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "7",
    slug: "shadow-cast",
    name: "Shadow Cast",
    price: 570,
    description:
      "Solid black sunglasses with tiered spotlight drama. Sun protection meets sculptural design.",
    category: "rectangular",
    material: "bio-acetate",
    colors: ["Onyx Black"],
    sizes: ["50", "52"],
    images: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "8",
    slug: "fusion-core",
    name: "Fusion Core",
    price: 495,
    description:
      "Double-bridge gold wire frames. Fusion of vintage aviator heritage and modern minimalism.",
    category: "aviator",
    material: "gold-plated",
    colors: ["Gold", "Silver"],
    sizes: ["48", "50"],
    images: ["https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "9",
    slug: "arc-shield",
    name: "Arc Shield",
    price: 720,
    description:
      "Tortoise gold shield frames with dramatic light. Statement sunwear for architectural minds.",
    category: "cat-eye",
    material: "bio-acetate",
    colors: ["Tortoise Gold"],
    sizes: ["50", "52"],
    images: ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    id: "10",
    slug: "rare-matte-black",
    name: "Rare Matte Black | Series 01",
    price: 420,
    description:
      "Round sunglasses on textured stone. The inaugural series in rare matte black finish.",
    category: "round",
    material: "titanium",
    colors: ["Matte Black"],
    sizes: ["48", "50"],
    images: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"],
    featured: true,
  },
  {
    id: "11",
    slug: "lumina-tortoise",
    name: "Lumina Tortoise | Series 02",
    price: 380,
    description:
      "Tortoiseshell optical frames on sunlit fabric. Warm tones, luminous clarity.",
    category: "round",
    material: "bio-acetate",
    colors: ["Tortoise"],
    sizes: ["48", "50"],
    images: ["https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80"],
    featured: true,
  },
];

export const collections = [
  {
    name: "The Linear Series",
    description: "Precision wire frames for the modern architect.",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
    href: "/shop?collection=linear",
  },
  {
    name: "Monolith Acetate",
    description: "Bold acetate silhouettes with structural weight.",
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
    href: "/shop?collection=monolith",
  },
  {
    name: "Heritage Core",
    description: "Timeless forms rooted in classical proportion.",
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&q=80",
    href: "/shop?collection=heritage",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getBestSellers() {
  return products.filter((p) => p.featured).slice(0, 4);
}
