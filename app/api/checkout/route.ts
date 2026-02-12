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
