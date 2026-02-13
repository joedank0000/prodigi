import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { DOWNLOAD_LINKS } from "@/app/lib/downloads";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    if (!customerEmail) return NextResponse.json({ received: true });

    // Get line items to find what they bought
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    const downloadLinks: string[] = [];
    for (const item of lineItems.data) {
      const name = item.description ?? "";
      const link = DOWNLOAD_LINKS[name.toUpperCase()];
      if (link) {
        downloadLinks.push(`<li style="margin-bottom:8px"><a href="${link}" style="color:#D4AF37">${name}</a></li>`);
      }
    }

    if (downloadLinks.length === 0) return NextResponse.json({ received: true });

    await resend.emails.send({
      from: "JoedankBeats <onboarding@resend.dev>",
      to: customerEmail,
      subject: "🎰 Your JoedankBeats Download is Ready",
      html: `
        <div style="background:#0a0a0a;padding:40px;font-family:monospace;color:white;max-width:600px;margin:0 auto">
          <h1 style="color:#D4AF37;font-size:2rem;letter-spacing:0.1em;margin-bottom:0.5rem">JACKPOT</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:0.8rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:2rem">
            Your purchase is confirmed
          </p>
          <p style="color:rgba(255,255,255,0.7);margin-bottom:1rem">
            Here are your download links:
          </p>
          <ul style="color:white;padding-left:1.5rem;margin-bottom:2rem">
            ${downloadLinks.join("")}
          </ul>
          <p style="color:rgba(255,255,255,0.3);font-size:0.75rem">
            Links are for personal use only. Do not share.<br/>
            — JoedankBeats
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ received: true });
}
