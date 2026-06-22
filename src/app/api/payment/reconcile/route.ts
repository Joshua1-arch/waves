import { Order } from "@/lib/models/Order";
import { getProductModel } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/mongodb";
import { PaystackService } from "@/lib/payment/paystack";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";
import { NextResponse } from "next/server";

interface OrderItem {
  productId: string;
  quantity: number;
  name: string;
}

/**
 * Atomically decrements stock for every item in a confirmed order.
 * Uses { $gte: qty } as the filter guard so stock never goes negative.
 */
async function decrementStockForOrder(
  items: OrderItem[]
) {
  const Product = getProductModel();
  for (const item of items) {
    if (!item.productId) continue;
    const result = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (result.modifiedCount === 0) {
      console.warn(
        `[STOCK] Reconciliation: could not decrement stock for product ${item.productId} ` +
        `("${item.name}"): stock was insufficient. Admin review required.`
      );
    }
  }
}

export async function GET(request: Request) {
  try {
    // 🟡 FIX #3: Fail CLOSED — require CRON_SECRET unconditionally
    // If the env var is missing, we refuse all requests rather than leaving the route open.
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("Authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Reconciliation route: unauthorized access attempt.");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDatabase();

    // Find all orders stuck in "initiated" state older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const pendingOrders = await Order.find({
      paymentStatus: "initiated",
      createdAt: { $lt: tenMinutesAgo },
    });

    console.log(`Reconciliation: found ${pendingOrders.length} pending orders to verify.`);

    let recoveredCount = 0;
    let failedCount = 0;

    for (const order of pendingOrders) {
      if (!order.paymentReference) continue;

      const verification = await PaystackService.verifyTransaction(order.paymentReference);

      if (verification.success && verification.status === "success") {
        // 🔴 FIX #1: Amount validation in reconciliation as well
        if (verification.amount !== order.total) {
          console.error(
            `[SECURITY] Reconciliation amount mismatch for order ${order.orderNumber}: ` +
            `expected ₦${order.total}, Paystack confirmed ₦${verification.amount}. Flagging.`
          );
          order.paymentStatus = "failed";
          await order.save();
          failedCount++;
          continue;
        }

        // 🟠 FIX #2: Atomic transition — safe even if webhook fires at same time
        const claimedOrder = await Order.findOneAndUpdate(
          { paymentReference: order.paymentReference, paymentStatus: { $ne: "success" } },
          { $set: { paymentStatus: "success" } },
          { new: false }
        );

        if (!claimedOrder) {
          // Already claimed by a concurrent webhook — skip booking
          console.log(`Reconciliation: Order ${order.orderNumber} already claimed by concurrent process.`);
          continue;
        }

        // Atomically claimed — now book the shipment

        // 🟡 FIX: Atomically decrement stock for each ordered product
        await decrementStockForOrder(
          (claimedOrder.items as OrderItem[]).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name,
          }))
        );

        const shipmentResult = await ShipbubbleService.createShipment(
          claimedOrder.orderNumber,
          {
            name: claimedOrder.shippingAddress.name,
            phone: claimedOrder.shippingAddress.phone,
            email: claimedOrder.shippingAddress.email,
            address: claimedOrder.shippingAddress.address,
            city: claimedOrder.shippingAddress.city,
            state: claimedOrder.shippingAddress.state,
            country: claimedOrder.shippingAddress.country,
          },
          claimedOrder.shippingOptionId,
          (claimedOrder.items as OrderItem[]).map((item) => ({
            name: item.name,
            quantity: item.quantity,
            weight: 0.5,
          }))
        );

        if (shipmentResult.success) {
          await Order.findOneAndUpdate(
            { paymentReference: order.paymentReference },
            {
              $set: {
                shipmentId: shipmentResult.shipmentId,
                trackingCode: shipmentResult.trackingCode,
              },
            }
          );
        } else {
          console.warn(
            `Reconciliation: Shipbubble booking failed for ${claimedOrder.orderNumber}: ${shipmentResult.message}.`
          );
        }

        recoveredCount++;
        console.log(`Reconciliation: recovered order ${claimedOrder.orderNumber}.`);
      } else if (verification.success && verification.status === "failed") {
        order.paymentStatus = "failed";
        await order.save();
        failedCount++;
        console.log(`Reconciliation: confirmed failed payment for order ${order.orderNumber}.`);
      }
      // status "initiated" / "abandoned" — leave as-is for the next cron sweep
    }

    return NextResponse.json({
      success: true,
      processed: pendingOrders.length,
      recovered: recoveredCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("Reconciliation route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
