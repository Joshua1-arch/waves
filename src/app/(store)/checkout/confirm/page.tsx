"use client";

import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { useCartStore } from "@/store/cart";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const clearCart = useCartStore((state) => state.clearCart);

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!reference || verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?reference=${encodeURIComponent(reference)}`);
        const resData = await response.json();

        if (response.ok && resData.success && resData.data.status === "success") {
          setStatus("success");
          setOrderNumber(resData.data.orderNumber);
          setTrackingCode(resData.data.trackingCode);
          clearCart(); // Securely empty the cart only when payment is verified
        } else {
          setStatus("error");
          setErrorMessage(resData.error || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("A network error occurred while verifying your payment.");
      }
    };

    verifyPayment();
  }, [reference, clearCart]);

  if (!reference) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="font-serif text-2xl mb-2">Invalid Access</h2>
        <p className="text-sm text-brand-black/60 mb-6">
          No transaction reference was provided. Please return to checkout.
        </p>
        <Link href="/checkout">
          <Button>Return to Checkout</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 text-center">
      {status === "verifying" && (
        <div className="space-y-6">
          <Loader2 className="mx-auto h-12 w-12 text-brand-gold animate-spin" />
          <h2 className="font-serif text-2xl">Verifying Payment...</h2>
          <p className="text-sm text-brand-black/60 leading-relaxed">
            Please wait while we confirm your transaction with Paystack. Do not close this window or navigate away.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="font-serif text-3xl">Thank You for Your Order!</h2>
          <p className="text-sm text-brand-black/60 leading-relaxed">
            Your transaction has been securely processed. We are arranging your delivery through our shipping service.
          </p>

          <div className="border border-brand-border bg-brand-cream/10 p-6 rounded-none text-left space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-brand-black/40">Order Reference</p>
              <p className="font-mono text-sm text-brand-black">{orderNumber || reference}</p>
            </div>
            {trackingCode && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-black/40">Shipbubble Courier Waybill</p>
                <p className="font-mono text-sm text-brand-gold font-medium">{trackingCode}</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth>Continue Shopping</Button>
            </Link>
            <Link href="/account" className="w-full sm:w-auto">
              <Button fullWidth>View My Orders</Button>
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="font-serif text-3xl text-red-600">Payment Verification Failed</h2>
          <p className="text-sm text-brand-black/60 leading-relaxed">
            {errorMessage || "We were unable to verify your payment status. If funds were deducted, please contact customer support."}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/checkout" className="w-full sm:w-auto">
              <Button fullWidth>Retry Payment</Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth>Contact Support</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <PageTransition>
      <div className="section-shell section-space pt-36 pb-24">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <Loader2 className="mx-auto h-12 w-12 text-brand-gold animate-spin" />
              <h2 className="font-serif text-2xl">Loading transaction details...</h2>
            </div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </div>
    </PageTransition>
  );
}
