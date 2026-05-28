import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!authenticatedUser) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    if (requestedUserId && requestedUserId !== authenticatedUser.id) {
      return apiError("Forbidden.", { status: 403 });
    }

    await connectToDatabase();

    const orders = await Order.find({ userId: authenticatedUser.id })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({
      orders: orders.map((order) => ({
        id: String(order._id),
        orderId: order.orderNumber,
        date: order.createdAt,
        items: order.items,
        total: order.total,
        status: order.status,
      })),
    });
  } catch {
    return apiError("Unable to fetch orders.", { status: 500 });
  }
}
