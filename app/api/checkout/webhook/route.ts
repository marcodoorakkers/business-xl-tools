import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Events that must be enabled in the Stripe dashboard webhook settings:
// - checkout.session.completed
// - invoice.payment_succeeded
// - customer.subscription.deleted
// - customer.subscription.updated

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

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      // Handle new Pro subscription
      let userId = session.metadata?.user_id;

      // Fall back to looking up by email if metadata missing
      if (!userId && session.customer_email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", session.customer_email)
          .single();
        userId = profile?.id;
      }

      if (!userId) {
        console.error("[webhook] subscription: could not resolve user_id", session.id);
        return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
      }

      await supabase
        .from("profiles")
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
        })
        .eq("id", userId);

      const { error: creditsError } = await supabase.rpc("set_subscription_credits", {
        user_id: userId,
        amount: 50,
      });
      if (creditsError) {
        console.error("[webhook] Failed to set credits on subscription_start:", creditsError);
      }

      await supabase.from("usage_logs").insert({
        user_id: userId,
        tool: "subscription_start",
        credits_used: -50,
      });

      console.log(`[webhook] Pro subscription started for user ${userId}`);
    } else {
      // Existing one-time payment logic
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits ?? "0");

      if (!userId || !credits) {
        console.error("[webhook] Missing metadata:", session.metadata);
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

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
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // Only act on renewal cycles, not the first payment (that's handled in checkout.session.completed)
    if (invoice.billing_reason !== "subscription_cycle") {
      return NextResponse.json({ received: true });
    }

    const customerId = invoice.customer as string;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile?.id) {
      console.error("[webhook] invoice.payment_succeeded: no profile for customer", customerId);
      return NextResponse.json({ received: true });
    }

    const { error: creditsError } = await supabase.rpc("set_subscription_credits", {
      user_id: profile.id,
      amount: 50,
    });
    if (creditsError) {
      console.error("[webhook] Failed to reset renewal credits:", creditsError);
    }

    await supabase.from("usage_logs").insert({
      user_id: profile.id,
      tool: "subscription_renewal",
      credits_used: -50,
    });

    console.log(`[webhook] Renewal credits added for user ${profile.id}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    await supabase
      .from("profiles")
      .update({
        subscription_status: null,
        stripe_subscription_id: null,
        subscription_period_end: null,
        subscription_credits: 0,
      })
      .eq("stripe_customer_id", customerId);

    console.log(`[webhook] Subscription deleted for customer ${customerId}`);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    const status = subscription.status === "canceled"
      ? null
      : subscription.status; // 'active', 'past_due', etc.

    // cancel_at is set when cancel_at_period_end=true; use it for period end tracking
    const periodEnd = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;

    await supabase
      .from("profiles")
      .update({
        subscription_status: status,
        subscription_period_end: periodEnd,
      })
      .eq("stripe_customer_id", customerId);

    console.log(`[webhook] Subscription updated for customer ${customerId}: status=${status}`);
  }

  return NextResponse.json({ received: true });
}
