import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("scan_email_token")
    .eq("id", user.id)
    .single();

  let token = profile?.scan_email_token as string | null;
  if (!token) {
    token = crypto.randomUUID();
    await admin.from("profiles").update({ scan_email_token: token }).eq("id", user.id);
  }

  return NextResponse.json({ email: `${token}@nooitmeerpostkwijt.nl` });
}
