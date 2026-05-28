import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";
import { Types } from "mongoose";

interface CustomerRecord {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
  status?: "active" | "suspended";
}

interface OrderRecord {
  _id: unknown;
  orderNumber: string;
  total: number;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  items: Array<{ name: string; quantity: number }>;
}

function isCustomerRecord(value: unknown): value is CustomerRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const customer = value as Record<string, unknown>;

  return (
    "_id" in customer &&
    typeof customer.name === "string" &&
    typeof customer.email === "string" &&
    customer.createdAt instanceof Date
  );
}

function isOrderRecord(value: unknown): value is OrderRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const order = value as Record<string, unknown>;

  return (
    "_id" in order &&
    typeof order.orderNumber === "string" &&
    typeof order.total === "number" &&
    typeof order.status === "string" &&
    order.createdAt instanceof Date &&
    Array.isArray(order.items)
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const payload = verifyAuthToken(token);

    if (payload.role !== "admin") {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return apiError("Customer not found.", { status: 404 });
    }

    await connectToDatabase();

    const customerDocument = await User.findOne({ _id: id, role: "customer" })
      .select("name email createdAt status")
      .lean();

    if (!isCustomerRecord(customerDocument)) {
      return apiError("Customer not found.", { status: 404 });
    }

    const orderDocuments = await Order.find({ userId: customerDocument._id })
      .sort({ createdAt: -1 })
      .lean();

    const orders = orderDocuments.filter(isOrderRecord);

    return apiSuccess({
      customer: {
        id: String(customerDocument._id),
        name: customerDocument.name,
        email: customerDocument.email,
        joinDate: customerDocument.createdAt,
        initials: getInitials(customerDocument.name),
        orderCount: orders.length,
        status: customerDocument.status ?? "active",
      },
      orders: orders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
      })),
    });
  } catch {
    return apiError("Unable to fetch customer profile.", { status: 500 });
  }
}
