"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageTransition } from "@/components/ui/PageTransition";
import { formatPrice } from "@/lib/utils";
import { useCartStore, useCartTotal } from "@/store/cart";
import { Lock, Shield, Truck, Loader2, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ShipbubbleRate {
  courier_id: string;
  courier_name: string;
  courier_image?: string;
  total_shipping_fee: number;
  delivery_eta: string;
  shipping_option_id: string;
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const cartTotal = useCartTotal();
  const router = useRouter();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Shipping Rates States
  const [rates, setRates] = useState<ShipbubbleRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShipbubbleRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch rates from Shipbubble via API route
  const handleFetchRates = async () => {
    if (!firstName || !lastName || !email || !phone || !address || !city || !state) {
      toast.error("Please fill in all shipping fields before calculating rates.");
      return;
    }

    setIsLoadingRates(true);
    setSelectedRate(null);
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            name: `${firstName} ${lastName}`,
            phone,
            email,
            address,
            city,
            state,
            country: "Nigeria",
          },
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            weight: 0.5, // assumed weight per item (e.g. sunglasses/case)
          })),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to retrieve shipping rates.");
      }

      setRates(resData.data.rates);
      if (resData.data.rates.length > 0) {
        setSelectedRate(resData.data.rates[0]); // Select first rate by default
        toast.success("Shipping rates calculated successfully.");
      } else {
        toast.error("No couriers available for this location.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not fetch shipping rates.");
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Submit order and redirect to Paystack
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRate) {
      toast.error("Please select a shipping delivery method.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: {
            name: `${firstName} ${lastName}`,
            phone,
            email,
            address,
            city,
            state,
            country: "Nigeria",
          },
          shippingOptionId: selectedRate.shipping_option_id,
          shippingCourier: selectedRate.courier_name,
          shippingCost: selectedRate.total_shipping_fee,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to initiate payment transaction.");
      }

      toast.loading("Redirecting to Paystack secure payment checkout...");
      
      // Redirect browser directly to Paystack payment gateway page
      window.location.href = resData.data.authorizationUrl;
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while setting up your order.");
      setIsSubmitting(false);
    }
  };

  const finalTotal = cartTotal + (selectedRate ? selectedRate.total_shipping_fee : 0);

  return (
    <PageTransition>
      <div className="section-shell section-space pt-28">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <nav className="overflow-x-auto text-[10px] uppercase tracking-widest text-brand-black/40 whitespace-nowrap">
            <Link href="/cart">Cart</Link>
            <span className="mx-2">›</span>
            <span className="text-brand-black">Shipping</span>
            <span className="mx-2">›</span>
            <span>Payment</span>
            <span className="mx-2">›</span>
            <span>Confirmation</span>
          </nav>
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
            <Lock className="h-3 w-3" /> Secure Checkout
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-5">
          <div className="space-y-12 lg:col-span-3">
            {/* 1. Shipping Address */}
            <section>
              <h2 className="font-serif text-2xl">Shipping Details</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Input
                  label="First Name"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="Street Address"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="sm:col-span-2"
                  required
                />
                <Input
                  label="City"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="State"
                  name="state"
                  placeholder="e.g. Lagos, Abuja"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchRates}
                    disabled={isLoadingRates || isSubmitting}
                  >
                    {isLoadingRates ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching Rates...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        Calculate Shipping Rates
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* 2. Shipbubble Courier Selection */}
            {rates.length > 0 && (
              <section className="space-y-6">
                <h2 className="font-serif text-2xl">Delivery Options</h2>
                <div className="grid gap-4">
                  {rates.map((rate) => (
                    <label
                      key={rate.shipping_option_id}
                      className={`flex items-center justify-between p-4 border transition-all duration-300 cursor-pointer ${
                        selectedRate?.shipping_option_id === rate.shipping_option_id
                          ? "border-brand-gold bg-brand-cream/10"
                          : "border-brand-border hover:border-brand-black/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_rate"
                          checked={selectedRate?.shipping_option_id === rate.shipping_option_id}
                          onChange={() => setSelectedRate(rate)}
                          className="text-brand-gold focus:ring-brand-gold"
                        />
                        <div>
                          <p className="font-medium text-sm text-brand-black uppercase tracking-wider">
                            {rate.courier_name}
                          </p>
                          <p className="text-xs text-brand-black/50">
                            Estimated delivery: {rate.delivery_eta}
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-brand-gold">
                        {formatPrice(rate.total_shipping_fee)}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Secure Redirect Information */}
            <section className="space-y-6">
              <h2 className="font-serif text-2xl">Payment Method</h2>
              <div className="border border-brand-border p-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <CreditCard className="h-6 w-6 text-brand-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm text-brand-black uppercase tracking-wider">
                      Paystack Secure Gateway
                    </h3>
                    <p className="text-xs text-brand-black/60 mt-1 leading-relaxed">
                      You will be safely redirected to Paystack to complete your purchase using card, bank transfer, USSD, or mobile money.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Button type="submit" fullWidth disabled={!selectedRate || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Secure Transaction...
                </>
              ) : (
                `Pay Securely — ${formatPrice(finalTotal)}`
              )}
            </Button>
          </div>

          <aside className="border border-brand-border bg-brand-white p-8 lg:col-span-2 self-start">
            <h2 className="font-serif text-xl">Order Summary</h2>
            <ul className="mt-6 space-y-6">
              {items.map((item) => (
                <li key={`${item.productId}-${item.color}`} className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-brand-cream">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium uppercase tracking-wider">
                      {item.name}
                    </p>
                    <p className="text-brand-black/50">
                      {item.color} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm text-brand-gold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-8 space-y-2 border-t border-brand-border pt-6 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {selectedRate ? formatPrice(selectedRate.total_shipping_fee) : "Calculated at next step"}
                </span>
              </div>
              <div className="flex justify-between pt-4 border-t border-brand-border mt-4 font-serif text-xl">
                <span>Total</span>
                <span className="text-brand-gold">{formatPrice(finalTotal)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3 border border-brand-border p-4 text-xs text-brand-black/60">
              <Shield className="h-4 w-4 shrink-0 text-brand-gold" />
              <p>
                256-bit SSL encryption. All transactions are securely processed by Paystack.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </PageTransition>
  );
}

