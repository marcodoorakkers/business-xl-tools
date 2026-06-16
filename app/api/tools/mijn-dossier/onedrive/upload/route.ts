import { createClient } from "@/lib/supabase/server";
import { createAdminClient, logUsage } from "@/lib/supabase/admin";
import { getValidAccessToken, uploadFileToOneDrive } from "@/lib/onedrive";
import { convertToPdf } from "@/lib/convert-to-pdf";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const accessToken = await getValidAccessToken(user.id);
  if (!accessToken) return NextResponse.json({ error: "OneDrive niet gekoppeld" }, { status: 400 });

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from("onedrive_tokens")
    .select("archive_root")
    .eq("user_id", user.id)
    .single();

  const archiveRoot = tokenRow?.archive_root ?? "MijnDossier";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const familyMember = (formData.get("familyMember") as string | null) ?? "";
  const mappad = (formData.get("mappad") as string | null) ?? "";
  const bestandsnaam = (formData.get("bestandsnaam") as string | null) ?? "";

  if (!file || !mappad || !bestandsnaam) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  // Strip archive_root prefix: AppFolder (/Apps/{AppName}/) is al de bovenste laag
  const strippedMappad = mappad.trim().startsWith(archiveRoot + "/")
    ? mappad.trim().slice(archiveRoot.length + 1)
    : mappad.trim();

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const pdfBuffer = await convertToPdf(rawBuffer, file.type || "application/octet-stream");
    const fullPath = `${strippedMappad}/${bestandsnaam}.pdf`;

    const { webUrl } = await uploadFileToOneDrive(accessToken, fullPath, pdfBuffer, "application/pdf");

    await supabase.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
    await logUsage(user.id, "mijn-dossier", 1);

    return NextResponse.json({ webUrl, path: fullPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload mislukt";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
