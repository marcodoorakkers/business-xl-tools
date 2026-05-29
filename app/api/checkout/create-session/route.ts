import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function buildCreditPackages(): Record<string, number> {
  const map: Record<string, number> = {};
  // Legacy prices (TimeSaverTools)
  if (process.env.STRIPE_PRICE_STARTER)  map[process.env.STRIPE_PRICE_STARTER]  = 50;
  if (process.env.STRIPE_PRICE_POPULAIR) map[process.env.STRIPE_PRICE_POPULAIR] = 200;
  if (process.env.STRIPE_PRICE_BESTEKOOP) map[process.env.STRIPE_PRICE_BESTEKOOP] = 500;
  // New credit packs
  if (process.env.STRIPE_PRICE_10)  map[process.env.STRIPE_PRICE_10]  = 10;
  if (process.env.STRIPE_PRICE_50)  map[process.env.STRIPE_PRICE_50]  = 50;
  if (process.env.STRIPE_PRICE_100) map[process.env.STRIPE_PRICE_100] = 100;
  if (process.env.STRIPE_PRICE_200) map[process.env.STRIPE_PRICE_200] = 200;
  return map;
}

export async function POST(req: NextRequest) {
  try {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId) {
    return NextResponse.json({ error: "Ongeldig pakket" }, { status: 400 });
  }

  // Gebruik het domein van de aanvrager zodat na betaling teruggestuurd wordt naar de juiste site
  const origin = req.headers.get("origin");
  const baseUrl = origin ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://timesavertools.nl";

  // Handle Pro subscription
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    // Create or retrieve Stripe customer
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Save customer id to profile
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await adminSupabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      success_url: `${baseUrl}/account?payment=subscribed`,
      cancel_url: `${baseUrl}/account?payment=cancelled`,
      payment_method_types: ["card", "ideal", "sepa_debit"],
      locale: "nl",
    });

    return NextResponse.json({ url: session.url });
  }

  // Handle one-time credit purchases
  const CREDIT_PACKAGES = buildCreditPackages();
  if (!CREDIT_PACKAGES[priceId]) {
    return NextResponse.json({ error: "Ongeldig pakket" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    metadata: {
      user_id: user.id,
      credits: CREDIT_PACKAGES[priceId].toString(),
    },
    success_url: `${baseUrl}/account?payment=success&credits=${CREDIT_PACKAGES[priceId]}`,
    cancel_url: `${baseUrl}/account?payment=cancelled`,
    payment_method_types: ["card", "ideal", "bancontact"],
    locale: "nl",
  });

  return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Checkout session error:", err);
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
