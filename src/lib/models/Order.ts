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
    // Stored at order creation so webhook/verify can atomically decrement
    // stock per product after confirmed payment, without a separate DB lookup.
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
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
      unique: true,
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
    paymentReference: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["initiated", "success", "failed"],
      default: "initiated",
    },
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "Nigeria" },
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    shippingCourier: {
      type: String,
    },
    shippingOptionId: {
      type: String,
    },
    shipmentId: {
      type: String,
    },
    trackingCode: {
      type: String,
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

