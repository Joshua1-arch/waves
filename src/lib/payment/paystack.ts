import crypto from "crypto";

interface PaystackInitializeResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  message?: string;
}

interface PaystackVerifyResponse {
  success: boolean;
  status?: "success" | "failed" | "abandoned" | "reversed";
  amount?: number;
  metadata?: any;
  message?: string;
}

export class PaystackService {
  private static getHeaders() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.warn("PAYSTACK_SECRET_KEY is not set in environment variables.");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey || ""}`,
    };
  }

  /**
   * Initializes a transaction with Paystack and retrieves the payment checkout URL.
   * @param email Customer's email address
   * @param amount Amount to charge in NGN (e.g. 5000)
   * @param reference Unique transaction reference generated on our side
   * @param callbackUrl Redirect URL after payment finishes
   * @param metadata Custom metadata to link to the transaction
   */
  static async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    callbackUrl: string,
    metadata?: any
  ): Promise<PaystackInitializeResponse> {
    try {
      // Paystack expects amount in Kobo (1 NGN = 100 Kobo)
      const amountInKobo = Math.round(amount * 100);

      const payload = {
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
        metadata,
      };

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Paystack initialization failed:", errorText);
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.status || !json.data) {
        return {
          success: false,
          message: json.message || "Failed to initialize transaction",
        };
      }

      return {
        success: true,
        authorizationUrl: json.data.authorization_url,
        reference: json.data.reference,
      };
    } catch (error: any) {
      console.error("Error initializing Paystack transaction:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred during payment setup",
      };
    }
  }

  /**
   * Verifies the status of a transaction directly with Paystack's API.
   * @param reference The unique transaction reference
   */
  static async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Paystack verification failed for ref ${reference}:`, errorText);
        throw new Error(`Paystack API error: ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.status || !json.data) {
        return {
          success: false,
          message: json.message || "Verification response invalid",
        };
      }

      const data = json.data;

      // Map Paystack status to our statuses
      // Amount in Paystack response is in Kobo, convert back to NGN
      return {
        success: true,
        status: data.status, // "success", "failed", "ongoing", etc.
        amount: data.amount / 100,
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error(`Error verifying Paystack transaction ${reference}:`, error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred during verification",
      };
    }
  }

  /**
   * Securely verifies if a webhook request actually came from Paystack.
   * Uses PAYSTACK_WEBHOOK_SECRET (dedicated signing secret) with fallback to PAYSTACK_SECRET_KEY.
   * @param rawBodyString Raw string body of the incoming webhook request
   * @param signatureHeader Value of the x-paystack-signature header
   */
  static verifyWebhookSignature(rawBodyString: string, signatureHeader: string): boolean {
    try {
      // Use the dedicated webhook secret; fall back to the API secret key if not separately configured
      const secretKey = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        console.error("Neither PAYSTACK_WEBHOOK_SECRET nor PAYSTACK_SECRET_KEY is defined. Cannot verify webhook signature.");
        return false;
      }

      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBodyString)
        .digest("hex");

      return hash === signatureHeader;
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }
}
