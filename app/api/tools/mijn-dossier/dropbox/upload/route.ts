import { createClient } from "@/lib/supabase/server";
import { createAdminClient, logUsage } from "@/lib/supabase/admin";
import { getValidDropboxToken, uploadFileToDropbox } from "@/lib/dropbox";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const accessToken = await getValidDropboxToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "Dropbox niet gekoppeld" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("dropbox_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const archiveRoot = tokenRow?.archive_root ?? "Archief";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const familyMember = (formData.get("familyMember") as string | null) ?? "";
  const mappad = (formData.get("mappad") as string | null) ?? "";
  const bestandsnaam = (formData.get("bestandsnaam") as string | null) ?? "";

  if (!file || !mappad || !bestandsnaam) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
  const parts = [archiveRoot, familyMember, mappad].map((s) => s.trim()).filter(Boolean);
  const folderPath = parts.join("/");
  const fullPath = `${folderPath}/${bestandsnaam}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { webUrl } = await uploadFileToDropbox(accessToken, fullPath, buffer, file.type || "application/octet-stream");

  await supabase.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
  await logUsage(user.id, "mijn-dossier", 1);

  return NextResponse.json({ webUrl, path: fullPath });
}
