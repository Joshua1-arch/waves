import type { OrderStatus } from "@/lib/types";
import { Schema, model, models, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"] satisfies OrderStatus[],
      default: "processing",
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const Order = models.Order || model("Order", orderSchema);
