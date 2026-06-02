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

  const { data: dropboxRow } = await admin
    .from("dropbox_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const { data: archiveSettings } = await admin
    .from("archive_settings")
    .select("storage_preference, folder_structure")
    .eq("user_id", user.id)
    .single();

  const { data: members } = await admin
    .from("archive_family_members")
    .select("name, full_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    connected: !!tokenRow,
    archiveRoot: tokenRow?.archive_root ?? "Archief",
    familyMembers: (members ?? []).map((m: { name: string }) => m.name),
    familyMemberDetails: members ?? [],
    dropboxConnected: !!dropboxRow,
    dropboxArchiveRoot: dropboxRow?.archive_root ?? "Archief",
    storagePreference: archiveSettings?.storage_preference ?? "local",
    folderStructure: archiveSettings?.folder_structure ?? "by_subject",
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  if (typeof body.archiveRoot === "string") {
    if (!body.archiveRoot.trim()) {
      return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
    }
    await admin.from("onedrive_tokens").update({
      archive_root: body.archiveRoot.trim(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.dropboxArchiveRoot === "string") {
    if (!body.dropboxArchiveRoot.trim()) {
      return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
    }
    await admin.from("dropbox_tokens").update({
      archive_root: body.dropboxArchiveRoot.trim(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.storagePreference === "string") {
    const valid = ["local", "onedrive", "dropbox"];
    if (!valid.includes(body.storagePreference)) {
      return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
    }
    await admin.from("archive_settings").upsert({
      user_id: user.id,
      storage_preference: body.storagePreference,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.folderStructure === "string") {
    const valid = ["by_subject", "by_person"];
    if (!valid.includes(body.folderStructure)) {
      return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
    }
    await admin.from("archive_settings").upsert({
      user_id: user.id,
      folder_structure: body.folderStructure,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
}
