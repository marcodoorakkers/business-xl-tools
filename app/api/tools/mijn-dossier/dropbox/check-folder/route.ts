import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidDropboxToken, checkDropboxFolderExists } from "@/lib/dropbox";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { familyMember, mappad } = await req.json();

  const accessToken = await getValidDropboxToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Dropbox niet gekoppeld" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("dropbox_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const archiveRoot = tokenRow?.archive_root ?? "MijnDossier";
  const parts = [archiveRoot, familyMember, mappad].map((s: string) => s?.trim()).filter(Boolean);
  const fullPath = parts.join("/");

  const exists = await checkDropboxFolderExists(accessToken, fullPath);

  return NextResponse.json({ exists, fullPath });
}
