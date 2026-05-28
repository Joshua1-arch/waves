import { Schema, type InferSchemaType, type Model } from "mongoose";
import mongoosePkg from "mongoose";

const { Schema: MongooseSchema } = mongoosePkg;

function slugifyCollectionName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const collectionSchema = new MongooseSchema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      unique: true,
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
    coverImage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

collectionSchema.pre("validate", function (next) {
  if ((!this.slug || !this.slug.trim()) && this.name) {
    this.slug = slugifyCollectionName(this.name);
  }

  next();
});

export type CollectionDocument = InferSchemaType<typeof collectionSchema> & {
  _id: string;
  createdAt: Date;
};

export function getCollectionModel(): Model<CollectionDocument> {
  const mongoose = mongoosePkg;

  return (mongoose.models.Collection as Model<CollectionDocument> | undefined) ??
    mongoose.model<CollectionDocument>("Collection", collectionSchema);
}
