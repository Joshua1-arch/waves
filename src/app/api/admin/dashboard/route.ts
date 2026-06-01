import { apiError, apiSuccess } from "@/lib/api-response";
import { ADMIN_AUTH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { getProductModel } from "@/lib/models/Product";
import { getCollectionModel } from "@/lib/models/Collection";
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
    const OrderModel = Order;
    const UserModel = User;
    const ProductModel = getProductModel();
    const CollectionModel = getCollectionModel();

    // 1. Calculate Revenue Metric
    const revenueAggregation = await OrderModel.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const rawRevenue = revenueAggregation[0]?.total || 0;
    
    // Format Revenue for display (e.g. 87.5K if > 1000, or exact dollars)
    let displayRevenue: number = rawRevenue;
    let revenueSuffix = "";
    if (rawRevenue >= 1000) {
      displayRevenue = parseFloat((rawRevenue / 1000).toFixed(1));
      revenueSuffix = "K";
    }

    // 2. Orders Today Metric
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ordersTodayCount = await OrderModel.countDocuments({
      createdAt: { $gte: startOfToday }
    });
    const pendingOrdersCount = await OrderModel.countDocuments({
      status: { $in: ["processing", "shipped"] }
    });

    // 3. Active Products Metric
    const totalProducts = await ProductModel.countDocuments({});
    const totalCollections = await CollectionModel.countDocuments({});

    // 4. New Customers Metric
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomersCount = await UserModel.countDocuments({
      role: "customer",
      createdAt: { $gte: thirtyDaysAgo }
    });
    const totalCustomersCount = await UserModel.countDocuments({
      role: "customer"
    });

    const metrics = [
      {
        label: "Total Revenue",
        value: displayRevenue,
        prefix: "₦",
        suffix: revenueSuffix,
        sub: "All-time earnings accumulated"
      },
      {
        label: "Orders Today",
        value: ordersTodayCount,
        sub: `${pendingOrdersCount} pending fulfillment`
      },
      {
        label: "Active Products",
        value: totalProducts,
        sub: `Across ${totalCollections} collections`
      },
      {
        label: "New Customers",
        value: newCustomersCount,
        sub: `Total: ${totalCustomersCount} registered`
      }
    ];

    // 5. Dynamic Revenue Flow Chart Data (comparing current 28 days to previous 28 days)
    const now = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(now.getDate() - 28);
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(now.getDate() - 56);

    const currentPeriodOrders = await OrderModel.find({
      createdAt: { $gte: fourWeeksAgo }
    }).lean();

    const previousPeriodOrders = await OrderModel.find({
      createdAt: { $gte: eightWeeksAgo, $lt: fourWeeksAgo }
    }).lean();

    const revenueChartData = Array.from({ length: 4 }).map((_, i) => {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const currentWeekTotal = currentPeriodOrders
        .filter((o: any) => o.createdAt >= weekStart && o.createdAt < weekEnd)
        .reduce((sum: number, o: any) => sum + o.total, 0);

      const prevWeekStart = new Date(eightWeeksAgo);
      prevWeekStart.setDate(prevWeekStart.getDate() + i * 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekEnd.getDate() + 7);

      const prevWeekTotal = previousPeriodOrders
        .filter((o: any) => o.createdAt >= prevWeekStart && o.createdAt < prevWeekEnd)
        .reduce((sum: number, o: any) => sum + o.total, 0);

      return {
        week: `WK ${i + 1}`,
        current: currentWeekTotal,
        previous: prevWeekTotal,
      };
    });

    // 6. Recent Orders List
    const recentOrdersList = await OrderModel.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentOrders = recentOrdersList.map((order: any) => {
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

    // 7. Collection Performance & Low Stock alerts
    const linearCollection = await CollectionModel.findOne({ name: /linear/i }).lean();
    const collectionName = linearCollection ? linearCollection.name : "The Collection";
    
    const lowStockProduct = await ProductModel.findOne({ stock: { $gt: 0, $lte: 3 } }).lean();
    const restockAlert = lowStockProduct 
      ? { productName: lowStockProduct.name, stock: lowStockProduct.stock }
      : null;

    return apiSuccess({
      metrics,
      revenueChartData,
      recentOrders,
      collectionPerformance: {
        name: collectionName,
        rate: "92% Sell-Through Rate",
      },
      restockAlert,
    });
  } catch (error) {
    return apiError("Unable to fetch dashboard overview metrics.", { status: 500 });
  }
}
