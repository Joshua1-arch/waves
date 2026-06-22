import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";
import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return apiError("Order number is required.", { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return apiError("Order not found.", { status: 404 });
    }

    if (order.shipmentId) {
      return apiError("Shipment is already booked for this order.", { status: 400 });
    }

    console.log(`Manual booking triggered by admin for order: ${orderNumber}`);

    // Call Shipbubble service to book the shipment
    const shipmentResult = await ShipbubbleService.createShipment(
      order.orderNumber,
      {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
        email: order.shippingAddress.email,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country,
      },
      order.shippingOptionId,
      order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        weight: 0.5,
      }))
    );

    if (!shipmentResult.success) {
      return apiError(shipmentResult.message || "Failed to book shipment with Shipbubble.", { status: 500 });
    }

    // Save shipment booking details
    order.shipmentId = shipmentResult.shipmentId;
    order.trackingCode = shipmentResult.trackingCode;
    order.status = "shipped";
    await order.save();

    return apiSuccess({
      message: "Shipment successfully booked and label created.",
      shipmentId: shipmentResult.shipmentId,
      trackingCode: shipmentResult.trackingCode,
    });
  } catch (error: any) {
    console.error("Manual shipping booking error:", error);
    return apiError(error.message || "Internal server error.", { status: 500 });
  }
}
