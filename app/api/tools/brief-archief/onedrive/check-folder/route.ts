import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken, checkFolderExists } from "@/lib/onedrive";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { familyMember, mappad } = await req.json();

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "OneDrive niet gekoppeld" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("onedrive_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const archiveRoot = tokenRow?.archive_root ?? "Archief";
  const parts = [archiveRoot, familyMember, mappad].map((s: string) => s?.trim()).filter(Boolean);
  const fullPath = parts.join("/");

  const exists = await checkFolderExists(accessToken, fullPath);

  return NextResponse.json({ exists, fullPath });
}
