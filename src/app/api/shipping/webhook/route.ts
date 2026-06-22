import { Order } from "@/lib/models/Order";
import { connectToDatabase } from "@/lib/mongodb";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";
import { NextResponse } from "next/server";

/**
 * Maps Shipbubble tracking status values to our local e-commerce Order statuses.
 */
function mapShipbubbleStatusToOrderStatus(shipbubbleStatus: string): "processing" | "shipped" | "delivered" | "cancelled" | null {
  if (!shipbubbleStatus) return null;
  const status = shipbubbleStatus.toLowerCase().trim();

  switch (status) {
    case "delivered":
    case "completed":
      return "delivered";

    case "cancelled":
    case "returned":
    case "failed":
    case "failed_delivery_attempt":
      return "cancelled";

    case "picked_up":
    case "in_transit":
    case "out_for_delivery":
    case "shipped":
    case "transit":
      return "shipped";

    case "pending":
    case "processing":
    case "pickup_scheduled":
    case "manifest_created":
    case "label_created":
    case "shipment_created":
      return "processing";

    default:
      return null;
  }
}

/**
 * Enforces status hierarchy transitions so that a delayed or duplicate webhook
 * cannot move an order backwards (e.g., transitioning "delivered" back to "shipped").
 */
function canTransitionStatus(currentStatus: string, newStatus: string): boolean {
  const hierarchy: Record<string, number> = {
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 4,
  };

  const currentVal = hierarchy[currentStatus] || 0;
  const newVal = hierarchy[newStatus] || 0;

  // Terminal cancelled state cannot override a completed delivery
  if (newStatus === "cancelled") {
    return currentStatus !== "delivered";
  }

  return newVal > currentVal;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-ship-signature");
    if (!signature) {
      console.warn("Shipbubble webhook received without x-ship-signature header.");
      return new NextResponse("Missing signature header", { status: 401 });
    }

    // 1. Read raw request body text for signature validation
    const rawBody = await request.text();

    // 2. Cryptographically verify webhook signature
    const isValid = ShipbubbleService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Shipbubble webhook signature verification failed.");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    // 3. Parse JSON payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventData = payload.data || payload;

    const orderId = eventData.order_id || eventData.shipment_id || eventData.id;
    const orderReference = eventData.order_reference || eventData.reference || eventData.order_number;

    console.log(`Shipbubble webhook received. Event: ${event}, Order ID: ${orderId}, Reference: ${orderReference}`);

    await connectToDatabase();

    // 4. Retrieve corresponding Order document
    let order = null;
    if (orderId) {
      order = await Order.findOne({ shipmentId: orderId });
    }
    if (!order && orderReference) {
      order = await Order.findOne({ orderNumber: orderReference });
    }

    if (!order) {
      console.warn(
        `Shipbubble Webhook: No order found matching shipmentId "${orderId}" ` +
        `or orderReference "${orderReference}". Acknowledging 200 to prevent retries.`
      );
      return new NextResponse("Order not found", { status: 200 });
    }

    // 5. Process different Shipbubble event types
    let targetOrderStatus: "processing" | "shipped" | "delivered" | "cancelled" | null = null;

    if (event === "shipment.status.changed") {
      let rawStatus = eventData.status;

      // Check if package_status logs exist and fetch the latest entry status
      if (Array.isArray(eventData.package_status) && eventData.package_status.length > 0) {
        const latest = eventData.package_status[eventData.package_status.length - 1];
        const latestStatus = typeof latest === "object" && latest !== null ? latest.status : latest;
        if (latestStatus) {
          rawStatus = latestStatus;
        }
      }

      targetOrderStatus = mapShipbubbleStatusToOrderStatus(rawStatus);
    } else if (event === "shipment.cancelled") {
      targetOrderStatus = "cancelled";
    } else if (event === "shipment.label.created") {
      targetOrderStatus = "processing";
    }

    // 6. Update order status if a valid status transition is calculated
    if (targetOrderStatus && targetOrderStatus !== order.status) {
      if (canTransitionStatus(order.status, targetOrderStatus)) {
        order.status = targetOrderStatus;
        
        // Also capture tracking code updates if present in the event data
        const trackingCode = eventData.tracking_code || eventData.waybill_number;
        if (trackingCode && trackingCode !== order.trackingCode) {
          order.trackingCode = trackingCode;
        }
        
        await order.save();
        console.log(`Shipbubble Webhook: Updated order ${order.orderNumber} status to "${targetOrderStatus}".`);
      } else {
        console.log(
          `Shipbubble Webhook: Ignored status transition for order ${order.orderNumber} ` +
          `from "${order.status}" to "${targetOrderStatus}" due to status hierarchy rules.`
        );
      }
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error: any) {
    console.error("Error in Shipbubble webhook route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
