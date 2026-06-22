/**
 * One-time diagnostic script: find orders with items missing productId.
 *
 * Context: productId was added to orderItemSchema as required: true during
 * the Paystack/Shipbubble integration. Any orders that existed before this
 * change will have items without productId, meaning stock was never decremented
 * for them. This script identifies those orders so you can manually verify
 * whether inventory adjustments are needed.
 *
 * This script is READ-ONLY — it makes no changes to your database.
 *
 * Usage:
 *   node scripts/audit-orders-missing-productid.mjs
 *
 * Requirements:
 *   MONGODB_URI must be set in .env.local
 */

import nextEnv from "@next/env";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function getMongoDbUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local before running this script.");
  }
  return uri;
}

// Minimal inline schema — avoids importing TS files from src/
const orderItemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: Number,
    productId: mongoose.Schema.Types.ObjectId,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: String,
    paymentStatus: String,
    paymentReference: String,
    total: Number,
    items: [orderItemSchema],
    createdAt: Date,
  },
  { strict: false, timestamps: true }
);

const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

async function auditOrdersMissingProductId() {
  await mongoose.connect(getMongoDbUri(), { bufferCommands: false });

  try {
    // Find any order that has at least one item with no productId field.
    // $elemMatch matches orders where ANY item is missing the field.
    const affectedOrders = await Order.find({
      "items.productId": { $exists: false },
    })
      .select("orderNumber paymentStatus paymentReference total items createdAt")
      .lean();

    if (affectedOrders.length === 0) {
      console.log(
        "\n✅ No affected orders found. All order items have a productId.\n" +
        "   This project is either fresh, or all orders were created after the schema migration.\n"
      );
      return;
    }

    // Separate into categories so you know what actually needs attention
    const paid = affectedOrders.filter((o) => o.paymentStatus === "success");
    const pending = affectedOrders.filter((o) => o.paymentStatus === "initiated");
    const failed = affectedOrders.filter((o) => o.paymentStatus === "failed");

    console.log(`\n⚠️  Found ${affectedOrders.length} order(s) with items missing productId.\n`);

    if (paid.length > 0) {
      console.log(
        `🔴 ${paid.length} PAID order(s) — stock was NEVER decremented for these.\n` +
        "   You should manually check and adjust inventory for each item below:\n"
      );
      for (const order of paid) {
        console.log(`  Order: ${order.orderNumber}  |  Total: ₦${order.total}  |  Created: ${order.createdAt}`);
        for (const item of order.items) {
          console.log(`    - ${item.name}  x${item.quantity}  (productId: ${item.productId ?? "MISSING"})`);
        }
      }
      console.log();
    }

    if (pending.length > 0) {
      console.log(
        `🟡 ${pending.length} PENDING order(s) — payment not confirmed. No stock decrement needed.\n` +
        "   If these are old enough, they may be abandoned. Reconciliation cron will handle them;\n" +
        "   the skip-if-no-productId guard means they'll book shipment but not touch stock.\n"
      );
      for (const order of pending) {
        console.log(`  Order: ${order.orderNumber}  |  Reference: ${order.paymentReference}  |  Created: ${order.createdAt}`);
      }
      console.log();
    }

    if (failed.length > 0) {
      console.log(
        `⚪ ${failed.length} FAILED order(s) — payment was never confirmed. No action needed.\n`
      );
    }

    console.log(
      "---\n" +
      "Next steps for any 🔴 PAID orders above:\n" +
      "  1. Note the item names and quantities.\n" +
      "  2. Manually decrement stock in your admin dashboard or directly in MongoDB.\n" +
      "  3. Mark the audit as complete once reconciled.\n"
    );
  } finally {
    await mongoose.disconnect();
  }
}

auditOrdersMissingProductId().catch((error) => {
  console.error("\n❌ Audit script failed:");
  console.error(error);
  process.exit(1);
});
