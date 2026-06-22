import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { ShipbubbleService } from "@/lib/shipping/shipbubble";

export async function POST(request: Request) {
  try {
    // 1. Basic Rate Limiting
    const rateLimit = checkRateLimit(request, "shipping-rates");
    if (rateLimit.limited) {
      return apiError("Too many rate requests. Please try again later.", {
        status: 429,
        details: { retryAfter: rateLimit.retryAfter },
      });
    }

    const body = await request.json();
    const { address, items } = body;

    // 2. Validate Address Input
    if (!address || !address.name || !address.phone || !address.address || !address.city || !address.state) {
      return apiError("Invalid shipping address. Name, phone, street address, city, and state are required.", {
        status: 400,
      });
    }

    // 3. Validate Items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiError("Your cart is empty or invalid.", { status: 400 });
    }

    // 4. Call Shipbubble to fetch rates
    const result = await ShipbubbleService.getShippingRates(
      {
        name: address.name,
        phone: address.phone,
        email: address.email || "customer@example.com",
        address: address.address,
        city: address.city,
        state: address.state,
        country: address.country || "Nigeria",
      },
      items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        weight: item.weight || 0.5, // default fallback
      }))
    );

    if (!result.success) {
      return apiError(result.message || "Failed to retrieve shipping rates.", {
        status: 500,
      });
    }

    return apiSuccess({ rates: result.rates });
  } catch (error: any) {
    console.error("Shipping rates route error:", error);
    return apiError("Internal server error while fetching shipping rates.", {
      status: 500,
    });
  }
}
