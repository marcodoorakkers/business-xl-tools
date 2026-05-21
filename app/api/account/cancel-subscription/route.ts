import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "Geen actief abonnement gevonden" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from("profiles")
    .update({ subscription_status: "cancelling" })
    .eq("id", user.id);

  // cancel_at is set when cancel_at_period_end=true; fall back to cancel_at
  const periodEnd = subscription.cancel_at ?? null;

  return NextResponse.json({
    success: true,
    periodEnd,
  });
}
