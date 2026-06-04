import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, subscription_status, subscription_period_end, promo_code, created_at");
  const { data: settings } = await admin
    .from("archive_settings")
    .select("user_id, storage_preference");
  const { data: docCounts } = await admin
    .from("documents")
    .select("user_id");

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.user_id, s]));

  // Tel documenten per gebruiker
  const docMap: Record<string, number> = {};
  (docCounts ?? []).forEach((d) => {
    docMap[d.user_id] = (docMap[d.user_id] || 0) + 1;
  });

  const users = (authUsers?.users ?? [])
    .filter((u) => {
      // Alleen NMMPK gebruikers — die hebben een subscription_status of komen van nooitmeerpostkwijt.nl
      const profile = profileMap[u.id];
      return profile?.subscription_status || profile?.promo_code;
    })
    .map((u) => {
      const profile = profileMap[u.id];
      const setting = settingsMap[u.id];
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        subscription_status: profile?.subscription_status ?? null,
        subscription_period_end: profile?.subscription_period_end ?? null,
        promo_code: profile?.promo_code ?? null,
        storage_preference: setting?.storage_preference ?? null,
        doc_count: docMap[u.id] ?? 0,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users });
}
