import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits ?? "0");

    if (!userId || !credits) {
      console.error("[webhook] Missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("add_credits", { user_id: userId, amount: credits });

    if (error) {
      console.error("[webhook] Failed to add credits:", error);
      return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
    }

    await supabase.from("usage_logs").insert({
      user_id: userId,
      tool: "credits_purchase",
      credits_used: -credits,
    });

    console.log(`[webhook] Added ${credits} credits to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
