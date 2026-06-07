import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId vereist" }, { status: 400 });

  const admin = createAdminClient();

  const { error: docsError, count: docsCount } = await admin
    .from("documents")
    .delete({ count: "exact" })
    .eq("user_id", userId);

  if (docsError) return NextResponse.json({ error: docsError.message }, { status: 500 });

  const { error: actiesError, count: actiesCount } = await admin
    .from("document_actions")
    .delete({ count: "exact" })
    .eq("user_id", userId);

  if (actiesError) return NextResponse.json({ error: actiesError.message }, { status: 500 });

  return NextResponse.json({ ok: true, docsDeleted: docsCount ?? 0, actiesDeleted: actiesCount ?? 0 });
}
