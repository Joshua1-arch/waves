import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
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
    // Token is expired, tampered, or malformed — treat as unauthenticated
    return null;
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    await connectToDatabase();

    // Ensure models are registered in Mongoose context
    const UserModel = User;
    const OrderModel = Order;

    const ordersList = await OrderModel.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    interface AdminOrderItem {
      name: string;
      quantity: number;
    }

    const orders = ordersList.map((order) => {
      const user = order.userId as unknown as { name?: string; email?: string } | null;
      const itemsList = (order.items || []) as AdminOrderItem[];
      const totalItems = itemsList.reduce((sum: number, item) => sum + (item.quantity || 0), 0);

      return {
        id: order.orderNumber,
        customer: user?.name || "Guest Customer",
        email: user?.email || "guest@example.com",
        date: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }).format(new Date(order.createdAt)),
        items: totalItems,
        itemsList: order.items,
        total: order.total,
        status: order.status,
        shippingAddress: order.shippingAddress,
        shippingCost: order.shippingCost,
        shippingCourier: order.shippingCourier,
        shippingOptionId: order.shippingOptionId,
        shipmentId: order.shipmentId,
        trackingCode: order.trackingCode,
        paymentReference: order.paymentReference,
        paymentStatus: order.paymentStatus,
      };
    });

    return apiSuccess({ orders });
  } catch (error) {
    return apiError("Unable to fetch orders.", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { orderNumber, status } = await request.json();

    if (!orderNumber || !status) {
      return apiError("Order number and status are required.", { status: 400 });
    }

    const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return apiError("Invalid status value.", { status: 400 });
    }

    await connectToDatabase();

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return apiError("Order not found.", { status: 404 });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    // Audit trail — log every status change with admin identity, timestamp, and before/after values
    console.log(
      `[AUDIT] Admin status change: order="${orderNumber}" ` +
      `changed from "${previousStatus}" → "${status}" ` +
      `by admin sub="${admin.sub}" email="${admin.email}" ` +
      `at ${new Date().toISOString()}`
    );

    return apiSuccess({
      message: `Order status successfully updated to ${status}.`,
      order: {
        id: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error: any) {
    return apiError(error.message || "Unable to update order status.", { status: 500 });
  }
}

