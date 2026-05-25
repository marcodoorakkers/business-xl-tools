import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const admin = createAdminClient();

  const { data: tokenRow } = await admin
    .from("onedrive_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const { data: members } = await admin
    .from("archive_family_members")
    .select("name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    connected: !!tokenRow,
    archiveRoot: tokenRow?.archive_root ?? "Archief",
    familyMembers: (members ?? []).map((m: { name: string }) => m.name),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { archiveRoot } = await req.json();
  if (typeof archiveRoot !== "string" || !archiveRoot.trim()) {
    return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("onedrive_tokens").update({
    archive_root: archiveRoot.trim(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
