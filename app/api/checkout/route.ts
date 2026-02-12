import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: body.line_items,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      shipping_address_collection: body.shipping_address_collection,
      payment_method_types: ["card"],
      metadata: body.metadata ?? {},
      automatic_tax: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ message }, { status: 500 });
  }
}