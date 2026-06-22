import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { Order } from "@/lib/models/Order";
import { getProductModel } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/mongodb";
import { PaystackService } from "@/lib/payment/paystack";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";

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
  items: Array<{ productId: any; quantity: number; name: string }>
) {
  const Product = getProductModel();

  for (const item of items) {
    if (!item.productId) continue;

    const result = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );

    if (result.modifiedCount === 0) {
      // Stock was already insufficient — log for admin investigation.
      // We do NOT roll back the payment; the order is still confirmed.
      console.warn(
        `[STOCK] Could not decrement stock for product ${item.productId} ` +
        `("${item.name}"): requested ${item.quantity} unit(s) but stock was insufficient. ` +
        `Admin review required.`
      );
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return apiError("Missing transaction reference.", { status: 400 });
    }

    // Require the user to be authenticated — prevents reference enumeration by strangers
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return apiError("Unauthorized. Please log in to verify your payment.", { status: 401 });
    }

    await connectToDatabase();

    // 1. Confirm this reference maps to a real order AND belongs to the authenticated user
    const pendingOrder = await Order.findOne({
      paymentReference: reference,
      userId: authenticatedUser.id,
    });
    if (!pendingOrder) {
      return apiError("Order not found for the given payment reference.", { status: 404 });
    }

    // Short-circuit if already successfully processed (idempotency — no Paystack call needed)
    if (pendingOrder.paymentStatus === "success") {
      return apiSuccess({
        status: "success",
        orderNumber: pendingOrder.orderNumber,
        trackingCode: pendingOrder.trackingCode,
      });
    }

    // 2. Verify status directly with Paystack API (server-to-server, no client involvement)
    const verification = await PaystackService.verifyTransaction(reference);

    if (!verification.success) {
      return apiError(verification.message || "Unable to verify transaction with Paystack.", {
        status: 500,
      });
    }

    // 3. Paystack reports charge.success — validate the amount BEFORE marking paid
    if (verification.status === "success") {
      // Amount validation — prevent replay attacks or partial payments
      if (verification.amount !== pendingOrder.total) {
        console.error(
          `[SECURITY] Amount mismatch for order ${pendingOrder.orderNumber}: ` +
          `expected ₦${pendingOrder.total}, Paystack confirmed ₦${verification.amount}. Flagging order.`
        );
        pendingOrder.paymentStatus = "failed";
        await pendingOrder.save();
        return apiError("Payment amount does not match order total. Transaction flagged.", {
          status: 400,
        });
      }

      // Atomic status transition — prevent race condition with concurrent webhook.
      // Only the caller that wins this atomic write proceeds to book the shipment.
      const claimedOrder = await Order.findOneAndUpdate(
        { paymentReference: reference, paymentStatus: { $ne: "success" } },
        { $set: { paymentStatus: "success" } },
        { new: false } // return the doc as it was BEFORE the update
      );

      if (!claimedOrder) {
        // Another concurrent request (webhook) already claimed this order — just return current state
        const existing = await Order.findOne({ paymentReference: reference });
        return apiSuccess({
          status: "success",
          orderNumber: existing?.orderNumber,
          trackingCode: existing?.trackingCode,
        });
      }

      // This request won the atomic update — safe to proceed exactly once

      // 🟡 FIX: Atomically decrement stock for each ordered product
      await decrementStockForOrder(
        (claimedOrder.items as OrderItem[]).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
        }))
      );

      // Book the shipment with Shipbubble
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
      } else {
        console.warn(
          `Shipbubble booking failed for order ${claimedOrder.orderNumber}: ${shipmentResult.message}. ` +
          `Payment is confirmed. Admin to manually book shipment.`
        );
      }

      const finalOrder = await Order.findOne({ paymentReference: reference });
      return apiSuccess({
        status: "success",
        orderNumber: finalOrder?.orderNumber,
        trackingCode: finalOrder?.trackingCode,
      });
    } else {
      // payment failed or abandoned — update status
      pendingOrder.paymentStatus = verification.status === "failed" ? "failed" : "initiated";
      await pendingOrder.save();

      return apiSuccess({
        status: verification.status,
        orderNumber: pendingOrder.orderNumber,
      });
    }
  } catch (error: any) {
    console.error("Payment verification route error:", error);
    return apiError("Internal server error during payment verification.", {
      status: 500,
    });
  }
}
