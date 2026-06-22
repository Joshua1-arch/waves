import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { Order } from "@/lib/models/Order";
import { getProductModel } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/mongodb";
import { PaystackService } from "@/lib/payment/paystack";
import { checkRateLimit } from "@/lib/rate-limit";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";

export async function POST(request: Request) {
  try {
    // 1. Rate limit per IP — each call makes a live Shipbubble request and writes to DB
    const rateLimit = checkRateLimit(request, "order-initialize");
    if (rateLimit.limited) {
      return apiError("Too many attempts. Please wait a moment and try again.", { status: 429 });
    }

    // 2. Authenticate user — must be logged in
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return apiError("Unauthorized. Please log in to complete your purchase.", { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress, shippingOptionId, shippingCourier } = body;
    // NOTE: We deliberately do NOT read shippingCost or item prices from the client body.
    // Both values will be independently computed server-side from trusted sources.

    // 2. Validate structure of incoming fields (not their values — that comes next)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiError("Cart is empty or invalid.", { status: 400 });
    }

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state
    ) {
      return apiError("Shipping details are incomplete.", { status: 400 });
    }

    // Enforce type and length limits — prevents resource exhaustion / oversized DB writes
    const strFields: [string, string, number][] = [
      ["shippingAddress.name",    String(shippingAddress.name),    120],
      ["shippingAddress.phone",   String(shippingAddress.phone),    30],
      ["shippingAddress.address", String(shippingAddress.address), 300],
      ["shippingAddress.city",    String(shippingAddress.city),    120],
      ["shippingAddress.state",   String(shippingAddress.state),   120],
    ];
    for (const [fieldName, value, maxLen] of strFields) {
      if (typeof value !== "string" || value.trim().length === 0) {
        return apiError(`${fieldName} must be a non-empty string.`, { status: 400 });
      }
      if (value.length > maxLen) {
        return apiError(`${fieldName} exceeds the maximum allowed length of ${maxLen} characters.`, { status: 400 });
      }
    }

    // shippingOptionId and shippingCourier are from Shipbubble's own response —
    // we still require them as identifiers, but we re-verify the cost independently.
    if (!shippingOptionId || !shippingCourier) {
      return apiError("Shipping method has not been selected.", { status: 400 });
    }

    if (typeof shippingOptionId !== "string" || shippingOptionId.length > 120) {
      return apiError("Invalid shipping option.", { status: 400 });
    }

    // Validate cart size and each item
    if (items.length > 50) {
      return apiError("Cart contains too many items.", { status: 400 });
    }

    // Validate each item has a productId and a sensible quantity
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.productId || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return apiError("Invalid item in cart. Missing product ID or invalid quantity.", { status: 400 });
      }
      if (qty > 100) {
        return apiError("Item quantity cannot exceed 100.", { status: 400 });
      }
    }

    await connectToDatabase();

    // 3. 🔴 CRITICAL FIX: Re-fetch prices from the database — never trust client-supplied prices
    const Product = getProductModel();
    const productIds = items.map((item: any) => item.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();

    // Build a quick-lookup map for O(1) access
    const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

    // Compute subtotal using only authoritative database prices
    let subtotal = 0;
    const resolvedItems: Array<{ name: string; quantity: number; productId: string; unitPrice: number }> = [];

    for (const item of items) {
      const product = productMap.get(String(item.productId));

      if (!product) {
        return apiError(`Product "${item.productId}" not found or no longer available.`, { status: 400 });
      }

      if (!product.inStock || product.stock <= 0) {
        return apiError(`"${product.name}" is currently out of stock.`, { status: 400 });
      }

      const qty = Number(item.quantity);

      if (qty > product.stock) {
        return apiError(
          `"${product.name}" only has ${product.stock} units in stock, but ${qty} were requested.`,
          { status: 400 }
        );
      }

      // Use salePrice if active, otherwise standard price — both come from DB
      const authorizedUnitPrice = product.salePrice ?? product.price;
      subtotal += authorizedUnitPrice * qty;

      resolvedItems.push({
        name: `${product.name} (${item.color || "Default"} / ${item.size || "Default"})`,
        quantity: qty,
        productId: String(product._id),
        unitPrice: authorizedUnitPrice,
      });
    }

    // 4. 🔴 CRITICAL FIX: Re-verify shipping cost from Shipbubble — never trust client-supplied shippingCost
    // We call Shipbubble again server-side with the exact same address and items.
    // This ensures the cost the customer is charged matches a real, current courier quote.
    const ratesResult = await ShipbubbleService.getShippingRates(
      {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        email: shippingAddress.email || authenticatedUser.email,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || "Nigeria",
      },
      resolvedItems.map((item) => ({ name: item.name, quantity: item.quantity, weight: 0.5 }))
    );

    if (!ratesResult.success || ratesResult.rates.length === 0) {
      return apiError(
        ratesResult.message || "Unable to verify shipping cost. Please re-calculate shipping and try again.",
        { status: 400 }
      );
    }

    // Find the specific courier the customer selected from the re-fetched rates
    const verifiedRate = ratesResult.rates.find(
      (rate) => rate.shipping_option_id === shippingOptionId
    );

    if (!verifiedRate) {
      return apiError(
        "The selected shipping option is no longer available. Please return to checkout and re-calculate rates.",
        { status: 400 }
      );
    }

    // This is now fully server-authoritative: subtotal from DB + shipping from Shipbubble
    const authorizedShippingCost = verifiedRate.total_shipping_fee;
    const totalAmount = subtotal + authorizedShippingCost;

    // 5. Generate unique, unpredictable order identifiers
    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `WAVES-${timestamp}`;
    const paymentReference = `ref-${timestamp}-${rand}`;

    // 6. Persist order in "initiated" state with the server-computed total
    const newOrder = new Order({
      userId: authenticatedUser.id,
      orderNumber,
      total: totalAmount, // ← sourced entirely from DB + Shipbubble, never from the client body
      status: "processing",
      items: resolvedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        productId: item.productId, // stored so webhook/verify can atomically decrement stock
      })),
      paymentReference,
      paymentStatus: "initiated",
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        email: shippingAddress.email || authenticatedUser.email,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || "Nigeria",
      },
      shippingCost: authorizedShippingCost, // ← from Shipbubble re-verification, not client
      shippingCourier: verifiedRate.courier_name,
      shippingOptionId: verifiedRate.shipping_option_id,
    });

    await newOrder.save();

    // 7. Initialize Paystack with the server-computed total
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const callbackUrl = `${origin}/checkout/confirm?reference=${paymentReference}`;

    const paystackResult = await PaystackService.initializeTransaction(
      authenticatedUser.email,
      totalAmount,
      paymentReference,
      callbackUrl,
      { orderNumber }
    );

    if (!paystackResult.success || !paystackResult.authorizationUrl) {
      newOrder.paymentStatus = "failed";
      await newOrder.save();
      return apiError(paystackResult.message || "Failed to initialize payment gateway.", {
        status: 500,
      });
    }

    return apiSuccess({
      authorizationUrl: paystackResult.authorizationUrl,
      reference: paymentReference,
      orderNumber,
    });
  } catch (error: any) {
    console.error("Initialize order error:", error);
    return apiError(error.message || "Internal server error while creating order.", {
      status: 500,
    });
  }
}
