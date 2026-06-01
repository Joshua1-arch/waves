import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { cookies } from "next/headers";

interface CustomerRecord {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
  status?: "active" | "suspended";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  return payload.role === "admin" ? payload : null;
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const query = {
      role: "customer",
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    const customerDocuments = await User.find(query)
      .select("name email createdAt status")
      .sort({ createdAt: -1 })
      .lean();

    const customers = customerDocuments.filter(isCustomerRecord);
    const customerIds = customers.map((customer) => customer._id);

    const orderCounts = await Order.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          userId: { $in: customerIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
    ]);

    const orderCountMap = new Map(
      orderCounts.map((entry) => [String(entry._id), entry.count]),
    );

    return apiSuccess({
      customers: customers.map((customer) => ({
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        joinDate: customer.createdAt,
        orderCount: orderCountMap.get(String(customer._id)) ?? 0,
        initials: getInitials(customer.name),
        status: customer.status ?? "active",
      })),
    });
  } catch {
    return apiError("Unable to fetch customers.", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const body = (await request.json()) as {
      customerId?: string;
      action?: "suspend" | "activate";
    };

    if (!body.customerId || !body.action) {
      return apiError("Customer ID and action are required.", { status: 400 });
    }

    await connectToDatabase();

    const status = body.action === "suspend" ? "suspended" : "active";

    const customer = await User.findOneAndUpdate(
      { _id: body.customerId, role: "customer" },
      { $set: { status } },
      { new: true },
    )
      .select("name email createdAt status")
      .lean();

    if (!isCustomerRecord(customer)) {
      return apiError("Customer not found.", { status: 404 });
    }

    return apiSuccess({
      customer: {
        id: String(customer._id),
        name: customer.name,
        email: customer.email,
        joinDate: customer.createdAt,
        status: customer.status ?? "active",
      },
      message:
        body.action === "suspend"
          ? "Customer suspended successfully."
          : "Customer reactivated successfully.",
    });
  } catch {
    return apiError("Unable to update customer status.", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return apiError("Unauthorized.", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return apiError("Customer ID is required.", { status: 400 });
    }

    await connectToDatabase();

    const deletedCustomer = await User.findOneAndDelete({
      _id: customerId,
      role: "customer",
    })
      .select("name email")
      .lean();

    if (!deletedCustomer || typeof deletedCustomer !== "object" || !("_id" in deletedCustomer)) {
      return apiError("Customer not found.", { status: 404 });
    }

    await Order.deleteMany({ userId: deletedCustomer._id });

    return apiSuccess({
      message: "Customer deleted successfully.",
    });
  } catch {
    return apiError("Unable to delete customer.", { status: 500 });
  }
}
