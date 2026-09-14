import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CREDIT_MAP: Record<string, number> = {
  "nl.nooitmeerpostkwijt.credits.25":  25,
  "nl.nooitmeerpostkwijt.credits.100": 100,
  "nl.nooitmeerpostkwijt.credits.300": 300,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.productId) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const creditsToAdd = CREDIT_MAP[body.productId];
  if (!creditsToAdd) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }

  // Validate the session from the request cookie
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Read current credits
  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (readError || !profile) {
    return NextResponse.json({ error: "profile not found" }, { status: 500 });
  }

  const newCredits = (profile.credits ?? 0) + creditsToAdd;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", user.id);

  if (updateError) {
    console.error("IAP credit update error", updateError);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, credits: newCredits });
}
