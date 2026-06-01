import { type InferSchemaType, type Model } from "mongoose";
import mongoosePkg from "mongoose";

const { Schema } = mongoosePkg;

function slugifyProductName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price must be greater than or equal to 0."],
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, "Sale price must be greater than or equal to 0."],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock must be greater than or equal to 0."],
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      index: true,
    },
    material: {
      type: String,
      required: [true, "Material is required."],
      trim: true,
      index: true,
    },
    colours: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    collection: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    suppressReservedKeysWarning: true,
  },
);

productSchema.pre("validate", function (next) {
  if ((!this.slug || !this.slug.trim()) && this.name) {
    this.slug = slugifyProductName(this.name);
  }

  next();
});

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: string;
  createdAt: Date;
};

export function getProductModel(): Model<ProductDocument> {
  const mongoose = mongoosePkg;

  return (mongoose.models.Product as Model<ProductDocument> | undefined) ??
    mongoose.model<ProductDocument>("Product", productSchema);
}
