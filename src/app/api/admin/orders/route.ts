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

  const payload = await verifyAuthToken(token);

  return payload.role === "admin" ? payload : null;
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

    const orders = ordersList.map((order: any) => {
      const user = order.userId;
      const totalItems = Array.isArray(order.items)
        ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        : 0;

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
        total: order.total,
        status: order.status,
      };
    });

    return apiSuccess({ orders });
  } catch (error) {
    return apiError("Unable to fetch orders.", { status: 500 });
  }
}
