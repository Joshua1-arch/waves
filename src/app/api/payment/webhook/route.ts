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
 * Uses { $gte: qty } as the filter guard — if stock has fallen below the
 * required quantity since order creation (e.g. concurrent purchase), the
 * update is skipped and the situation is logged for admin review.
 * Stock never goes negative.
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
        `[STOCK] Could not decrement stock for product ${item.productId} ` +
        `("${item.name}"): requested ${item.quantity} unit(s) but stock was insufficient. ` +
        `Admin review required.`
      );
    }
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      console.warn("Paystack webhook received without signature header.");
      return new NextResponse("Missing signature", { status: 401 });
    }

    // 1. Retrieve raw body text for signature verification
    const rawBody = await request.text();

    // 2. Cryptographically verify HMAC SHA512 signature — reject fakes immediately
    const isValid = PaystackService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Paystack webhook signature verification failed.");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // 3. Parse payload safely
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`Paystack webhook received. Event: ${event}, Reference: ${data?.reference}`);

    await connectToDatabase();

    // 4. Handle successful charges
    if (event === "charge.success") {
      const reference = data.reference;
      // Paystack sends the amount in Kobo — convert to Naira to compare against stored total
      const paidAmountNaira = data.amount / 100;

      // Amount validation — verify Paystack's confirmed amount matches order total
      const orderForValidation = await Order.findOne({ paymentReference: reference });
      if (!orderForValidation) {
        console.error(`Webhook: Order not found for reference: ${reference}`);
        return new NextResponse("Order not found", { status: 200 });
      }

      if (paidAmountNaira !== orderForValidation.total) {
        console.error(
          `[SECURITY] Webhook amount mismatch for order ${orderForValidation.orderNumber}: ` +
          `expected ₦${orderForValidation.total}, Paystack confirmed ₦${paidAmountNaira}. Flagging.`
        );
        orderForValidation.paymentStatus = "failed";
        await orderForValidation.save();
        return new NextResponse("Amount mismatch — order flagged", { status: 200 });
      }

      // Atomic status transition — prevents double-booking with concurrent verify-on-redirect
      const claimedOrder = await Order.findOneAndUpdate(
        { paymentReference: reference, paymentStatus: { $ne: "success" } },
        { $set: { paymentStatus: "success" } },
        { new: false }
      );

      if (!claimedOrder) {
        console.log(`Webhook: Order for reference ${reference} already processed. Skipping.`);
        return new NextResponse("Already processed", { status: 200 });
      }

      // 🟡 FIX: Atomically decrement stock — only the winner of the atomic claim reaches here
      await decrementStockForOrder(
        (claimedOrder.items as OrderItem[]).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
        }))
      );

      // Book shipment with Shipbubble
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
          { paymentReference: reference },
          {
            $set: {
              shipmentId: shipmentResult.shipmentId,
              trackingCode: shipmentResult.trackingCode,
            },
          }
        );
        console.log(`Webhook: Order ${claimedOrder.orderNumber} paid, stock decremented, and shipment booked.`);
      } else {
        console.warn(
          `Webhook: Shipbubble booking failed for order ${claimedOrder.orderNumber}: ${shipmentResult.message}. ` +
          `Payment confirmed. Admin to manually book shipment.`
        );
      }
    }

    // Handle charge.failed — update order immediately instead of waiting for reconciliation
    if (event === "charge.failed") {
      const reference = data.reference;
      const order = await Order.findOne({ paymentReference: reference });
      if (order && order.paymentStatus !== "success") {
        order.paymentStatus = "failed";
        await order.save();
        console.log(`Webhook: Order ${order.orderNumber} marked failed via charge.failed event.`);
      }
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error: any) {
    console.error("Webhook route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
