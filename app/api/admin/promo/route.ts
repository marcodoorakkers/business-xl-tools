import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: promo } = await admin
    .from("promo_codes")
    .select("code, active, uses, max_uses, trial_days")
    .eq("code", "vriendenvan")
    .single();

  return NextResponse.json({ promo });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { active } = await req.json();
  const admin = createAdminClient();
  await admin
    .from("promo_codes")
    .update({ active })
    .eq("code", "vriendenvan");

  return NextResponse.json({ ok: true, active });
}
