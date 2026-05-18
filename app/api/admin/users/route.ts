import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const { data: profiles } = await admin.from("profiles").select("id, credits, created_at");
  const { data: logs } = await admin.from("usage_logs").select("user_id, tool, created_at");

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const logMap: Record<string, number> = {};
  (logs || []).forEach((l) => { logMap[l.user_id] = (logMap[l.user_id] || 0) + 1; });

  const users = (authUsers?.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    credits: profileMap[u.id]?.credits ?? 0,
    total_usage: logMap[u.id] || 0,
  }));

  return NextResponse.json({ users });
}
