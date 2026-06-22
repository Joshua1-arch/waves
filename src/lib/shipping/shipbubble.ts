import crypto from "crypto";

interface AddressInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
}

interface ShipbubbleRate {
  courier_id: string;
  courier_name: string;
  courier_image?: string;
  total_shipping_fee: number;
  delivery_eta: string;
  shipping_option_id: string;
}

interface RequestRatesResponse {
  success: boolean;
  rates: ShipbubbleRate[];
  message?: string;
}

export class ShipbubbleService {
  private static getHeaders() {
    const apiKey = process.env.SHIPBUBBLE_API_KEY;
    if (!apiKey) {
      console.warn("SHIPBUBBLE_API_KEY is not set in environment variables.");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey || ""}`,
    };
  }

  private static getBaseUrl() {
    // If SHIPBUBBLE_BASE_URL contains api-test, override it with the working api.shipbubble.com
    const envUrl = process.env.SHIPBUBBLE_BASE_URL;
    if (envUrl && !envUrl.includes("api-test")) {
      return envUrl;
    }
    return "https://api.shipbubble.com/v1";
  }

  /**
   * Helper to validate addresses and retrieve the address code.
   */
  static async validateAddress(address: AddressInput): Promise<number | null> {
    try {
      const baseUrl = this.getBaseUrl();
      const countryStr = address.country || "Nigeria";
      
      // Ensure country is in the address string for accuracy
      let addressString = address.address;
      if (!addressString.toLowerCase().includes(countryStr.toLowerCase())) {
        addressString = `${addressString}, ${address.city}, ${address.state}, ${countryStr}`;
      }

      const response = await fetch(`${baseUrl}/shipping/address/validate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name: address.name,
          email: address.email || "customer@example.com",
          phone: address.phone,
          address: addressString,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shipbubble address validation failed:", errorText);
        return null;
      }

      const json = await response.json();
      if (json.status === "success" && json.data && json.data.address_code) {
        return Number(json.data.address_code);
      }
      
      return null;
    } catch (error) {
      console.error("Error validating address with Shipbubble:", error);
      return null;
    }
  }

  /**
   * Helper to get sender address code.
   */
  private static async getSenderAddressCode(): Promise<number> {
    const senderIdEnv = process.env.SHIPBUBBLE_SENDER_ADDRESS_ID;
    if (senderIdEnv && /^\d+$/.test(senderIdEnv)) {
      return parseInt(senderIdEnv, 10);
    }
    
    // Fallback: validate default warehouse address
    console.warn("SHIPBUBBLE_SENDER_ADDRESS_ID is not configured or is a placeholder. Using fallback warehouse address.");
    const code = await this.validateAddress({
      name: "Waves Shop Warehouse",
      email: "warehouse@wavesandco.com",
      phone: "08012345678",
      address: "12 Admiralty Way, Lekki Phase 1, Lagos",
      city: "Eti Osa",
      state: "Lagos",
      country: "Nigeria"
    });
    
    if (!code) {
      throw new Error("Failed to validate fallback sender address. Check Shipbubble credentials and connectivity.");
    }
    return code;
  }

  /**
   * Fetches real-time shipping rates from Shipbubble courier partners.
   */
  static async getShippingRates(
    deliveryAddress: AddressInput,
    items: Array<{ name: string; quantity: number; weight?: number }>
  ): Promise<RequestRatesResponse> {
    try {
      const baseUrl = this.getBaseUrl();
      const senderAddressCode = await this.getSenderAddressCode();
      const receiverAddressCode = await this.validateAddress(deliveryAddress);

      if (!receiverAddressCode) {
        return {
          success: false,
          rates: [],
          message: "Could not validate delivery address. Please ensure street, city, state, and country are correct.",
        };
      }

      const totalWeight = items.reduce((acc, item) => {
        const itemWeight = item.weight || 0.5;
        return acc + itemWeight * item.quantity;
      }, 0);

      const payload = {
        sender_address_code: senderAddressCode,
        reciever_address_code: receiverAddressCode,
        pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        category_id: 74794423, // Fashion wears (fits eyewear catalog)
        package_items: items.map(item => ({
          name: item.name,
          description: item.name,
          quantity: item.quantity,
          unit_amount: 2000,
          unit_weight: item.weight || 0.5
        })),
        package_dimension: {
          length: 10,
          width: 10,
          height: 10,
        },
      };

      const response = await fetch(`${baseUrl}/shipping/fetch_rates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shipbubble fetch rates failed:", errorText);
        throw new Error(`Shipbubble API error: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.status !== "success" || !json.data || !json.data.couriers) {
        return {
          success: false,
          rates: [],
          message: json.message || "Failed to fetch rates from Shipbubble",
        };
      }

      // Map courier options into our UI-friendly format
      const rates: ShipbubbleRate[] = json.data.couriers.map((courier: any) => ({
        courier_id: courier.courier_id || courier.service_code,
        courier_name: courier.courier_name,
        courier_image: courier.courier_image,
        total_shipping_fee: Number(courier.total || courier.rate_card_amount || 0),
        delivery_eta: courier.delivery_eta || "2-5 days",
        shipping_option_id: courier.service_code,
      }));

      return {
        success: true,
        rates,
      };
    } catch (error: any) {
      console.error("Error getting Shipbubble rates:", error);
      return {
        success: false,
        rates: [],
        message: error.message || "An unexpected error occurred while fetching shipping rates",
      };
    }
  }

  /**
   * Books a shipment / creates an order in Shipbubble.
   */
  static async createShipment(
    orderNumber: string,
    deliveryAddress: AddressInput,
    shippingOptionId: string,
    items: Array<{ name: string; quantity: number; weight?: number }>
  ): Promise<{ success: boolean; shipmentId?: string; trackingCode?: string; message?: string }> {
    try {
      const baseUrl = this.getBaseUrl();
      const senderAddressCode = await this.getSenderAddressCode();
      const receiverAddressCode = await this.validateAddress(deliveryAddress);

      if (!receiverAddressCode) {
        throw new Error("Could not validate delivery address for shipment creation.");
      }

      // 1. Fetch rates to get a valid request token
      const payload = {
        sender_address_code: senderAddressCode,
        reciever_address_code: receiverAddressCode,
        pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        category_id: 74794423, // Fashion wears
        package_items: items.map(item => ({
          name: item.name,
          description: item.name,
          quantity: item.quantity,
          unit_amount: 2000,
          unit_weight: item.weight || 0.5
        })),
        package_dimension: {
          length: 10,
          width: 10,
          height: 10,
        },
      };

      const ratesResponse = await fetch(`${baseUrl}/shipping/fetch_rates`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!ratesResponse.ok) {
        const errorText = await ratesResponse.text();
        throw new Error(`Failed to retrieve rate token for booking: ${errorText}`);
      }

      const ratesJson = await ratesResponse.json();
      if (ratesJson.status !== "success" || !ratesJson.data || !ratesJson.data.request_token) {
        throw new Error("Invalid rate token response from Shipbubble");
      }

      const requestToken = ratesJson.data.request_token;
      
      // Find the courier matching the selected shippingOptionId
      const courier = ratesJson.data.couriers.find(
        (c: any) => c.service_code === shippingOptionId || c.courier_id === shippingOptionId
      ) || ratesJson.data.couriers[0];

      if (!courier) {
        throw new Error("No couriers available for the selected option");
      }

      // 2. Book shipment using POST /shipping/labels
      const response = await fetch(`${baseUrl}/shipping/labels`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          request_token: requestToken,
          service_code: courier.service_code,
          courier_id: courier.courier_id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shipbubble create shipment label failed:", errorText);
        throw new Error(`Shipbubble API error: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.status !== "success" || !json.data) {
        return {
          success: false,
          message: json.message || "Failed to book shipment in Shipbubble",
        };
      }

      return {
        success: true,
        shipmentId: json.data.order_id,
        trackingCode: json.data.order_id,
      };
    } catch (error: any) {
      console.error("Error creating Shipbubble shipment:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred while booking the shipment",
      };
    }
  }

  /**
   * Securely verifies if a webhook request actually came from Shipbubble.
   * @param rawBodyString Raw string body of the incoming webhook request
   * @param signatureHeader Value of the x-ship-signature header
   */
  static verifyWebhookSignature(rawBodyString: string, signatureHeader: string): boolean {
    try {
      const secretKey = process.env.SHIPBUBBLE_WEBHOOK_SECRET || process.env.SHIPBUBBLE_API_KEY;
      if (!secretKey) {
        console.error("Shipbubble API Key / Webhook Secret is not defined. Cannot verify webhook signature.");
        return false;
      }

      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBodyString)
        .digest("hex");

      return hash.toLowerCase() === signatureHeader.toLowerCase();
    } catch (error) {
      console.error("Error verifying Shipbubble webhook signature:", error);
      return false;
    }
  }
}
