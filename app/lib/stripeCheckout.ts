/**
 * stripeCheckout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cart types and a Stripe Checkout integration utility.
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Install dependencies:
 *      npm install @stripe/stripe-js stripe
 *
 * 2. Add environment variables to .env.local:
 *      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
 *      STRIPE_SECRET_KEY=sk_live_...
 *
 * 3. Create the API route at:  app/api/checkout/route.ts
 *    (Full code is included at the bottom of this file as a comment block.)
 *
 * 4. In your Stripe Dashboard → Settings → Payment methods:
 *    - Enable "Apple Pay"  (requires a verified domain)
 *    - Enable "Google Pay" (enabled automatically for Stripe Checkout)
 *
 * 5. For Apple Pay domain verification, add:
 *    public/.well-known/apple-developer-merchantid-domain-association
 *    (Download the file from Stripe Dashboard → Settings → Payment methods → Apple Pay)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Stripe } from "@stripe/stripe-js";

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number; // in USD (e.g. 29.99)
  type: "Beat" | "Drumkit" | "Merch";
  quantity: number;
  /** For merch: selected size */
  size?: string;
  /** Optional Stripe price ID if you're using pre-created prices */
  stripePriceId?: string;
}

export interface CheckoutLineItem {
  price_data: {
    currency: "usd";
    unit_amount: number; // in cents
    product_data: {
      name: string;
      description?: string;
      metadata?: Record<string, string>;
    };
  };
  quantity: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a CartItem to a Stripe line_item object */
export function cartItemToLineItem(item: CartItem): CheckoutLineItem {
  return {
    price_data: {
      currency: "usd",
      unit_amount: Math.round(item.price * 100), // dollars → cents
      product_data: {
        name: item.name,
        description: item.size ? `Size: ${item.size}` : undefined,
        metadata: {
          type: item.type,
          internal_id: item.id,
        },
      },
    },
    quantity: item.quantity,
  };
}

// ─── Stripe Checkout Utility ──────────────────────────────────────────────────

export const StripeCheckoutUtil = {
  /**
   * Creates a Stripe Checkout Session via your API route, then redirects the
   * user to the hosted checkout page (which includes Apple Pay & Google Pay).
   *
   * @param cart   - The current cart items
   * @param origin - Override the success/cancel URL origin (optional)
   */
  async redirectToCheckout(
    cart: CartItem[],
    origin?: string
  ): Promise<void> {
    if (cart.length === 0) {
      console.warn("[StripeCheckout] Cart is empty — aborting checkout.");
      return;
    }

    const base =
      origin ??
      (typeof window !== "undefined" ? window.location.origin : "");

    const lineItems = cart.map(cartItemToLineItem);

    try {
      // Call your Next.js API route to create the session server-side
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          // Separate digital vs physical so Stripe can handle shipping
          mode: "payment",
          success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${base}/#beats`,
          // Collect shipping address only when merch is in the cart
          shipping_address_collection: cart.some((i) => i.type === "Merch")
            ? { allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"] }
            : undefined,
          // Enable Apple Pay / Google Pay via payment_method_types
          payment_method_types: ["card", "apple_pay", "google_pay"],
          // Attach metadata for your fulfilment logic
          metadata: {
            contains_beats: String(cart.some((i) => i.type === "Beat")),
            contains_drumkits: String(cart.some((i) => i.type === "Drumkit")),
            contains_merch: String(cart.some((i) => i.type === "Merch")),
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message ?? `HTTP ${response.status}`);
      }

      const { url } = (await response.json()) as { url: string };
      if (!url) throw new Error("No checkout URL returned from API.");

      window.location.href = url;
    } catch (error) {
      console.error("[StripeCheckout] Error creating checkout session:", error);
      // In production you'd show a toast/modal here
      alert(
        "Checkout failed. Please try again or contact support.\n\n" +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  /**
   * Calculate cart totals for display purposes.
   */
  getCartTotals(cart: CartItem[]): {
    subtotal: number;
    itemCount: number;
    formattedSubtotal: string;
  } {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return {
      subtotal,
      itemCount,
      formattedSubtotal: `$${subtotal.toFixed(2)}`,
    };
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   API ROUTE — app/api/checkout/route.ts
   Copy this entire block into that file.
   ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: body.mode ?? "payment",
      line_items: body.line_items,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      shipping_address_collection: body.shipping_address_collection,
      // Apple Pay / Google Pay are enabled via payment_method_types.
      // Note: "apple_pay" and "google_pay" are Stripe Checkout wallet options;
      // the user's browser/device determines which wallet is shown.
      payment_method_types: ["card"],
      // Wallets (Apple Pay / Google Pay) are automatically enabled in Stripe
      // Checkout when payment_method_configuration is set; for full control
      // you can also set: payment_method_options.card.network etc.
      metadata: body.metadata ?? {},
      // For digital goods — disable automatic tax / shipping rate
      automatic_tax: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

   ═══════════════════════════════════════════════════════════════════════════════
   WEBHOOK — app/api/webhooks/stripe/route.ts
   Add this to handle post-payment fulfilment (download links, shipping triggers)
   ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // TODO: Send download links for digital products
    // TODO: Trigger shipping for physical merch
    console.log("Payment complete for session:", session.id);
  }

  return NextResponse.json({ received: true });
}

   ═══════════════════════════════════════════════════════════════════════════════ */
