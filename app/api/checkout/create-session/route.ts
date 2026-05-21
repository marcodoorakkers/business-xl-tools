import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CREDIT_PACKAGES: Record<string, number> = {
  "price_1TZSta1ifGSUEPSdHvDnulnr": 50,   // Starter
  "price_1TZSte1ifGSUEPSd9N8emyuz": 200,  // Populair
  "price_1TZStd1ifGSUEPSdlWmrtbOS": 500,  // Beste Koop
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId || !CREDIT_PACKAGES[priceId]) {
    return NextResponse.json({ error: "Ongeldig pakket" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://timesavertools.nl";

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
}
