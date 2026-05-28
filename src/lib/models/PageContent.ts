import type { InferSchemaType, Model } from "mongoose";
import mongoosePkg from "mongoose";

const { Schema } = mongoosePkg;

const pageContentSectionSchema = new Schema(
  {
    key: {
      type: String,
      required: [true, "Section key is required."],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Section value is required."],
      default: "",
    },
  },
  { _id: false },
);

const pageContentSchema = new Schema(
  {
    slug: {
      type: String,
      required: [true, "Slug is required."],
      unique: true,
      trim: true,
      lowercase: true,
      enum: ["home", "about", "contact"],
      index: true,
    },
    sections: {
      type: [pageContentSectionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type PageContentDocument = InferSchemaType<typeof pageContentSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export function getPageContentModel(): Model<PageContentDocument> {
  const mongoose = mongoosePkg;

  return (mongoose.models.PageContent as Model<PageContentDocument> | undefined) ??
    mongoose.model<PageContentDocument>("PageContent", pageContentSchema);
}
