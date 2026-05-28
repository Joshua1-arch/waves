import { type InferSchemaType, type Model } from "mongoose";
import mongoosePkg from "mongoose";

const { Schema } = mongoosePkg;

function slugifyTaxonomyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const taxonomySchema = new Schema(
  {
    type: {
      type: String,
      enum: ["category", "material"],
      required: [true, "Type is required."],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

taxonomySchema.index({ type: 1, name: 1 }, { unique: true });
taxonomySchema.index({ type: 1, slug: 1 }, { unique: true });

taxonomySchema.pre("validate", function (next) {
  if ((!this.slug || !this.slug.trim()) && this.name) {
    this.slug = slugifyTaxonomyName(this.name);
  }

  next();
});

export type TaxonomyDocument = InferSchemaType<typeof taxonomySchema> & {
  _id: string;
  createdAt: Date;
};

export function getTaxonomyModel(): Model<TaxonomyDocument> {
  const mongoose = mongoosePkg;

  return (mongoose.models.Taxonomy as Model<TaxonomyDocument> | undefined) ??
    mongoose.model<TaxonomyDocument>("Taxonomy", taxonomySchema);
}
