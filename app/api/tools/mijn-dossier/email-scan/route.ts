import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { getValidAccessToken, uploadFileToOneDrive } from "@/lib/onedrive";
import { getValidDropboxToken, forceRefreshDropboxToken, uploadFileToDropbox } from "@/lib/dropbox";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Cloudflare Worker stuurt een gedeeld secret mee
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.CLOUDFLARE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    recipient: string;
    filename: string;
    contentType: string;
    data: string; // base64
  };

  const { recipient, filename, contentType, data } = body;
  if (!recipient || !data) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  // Token uit het e-mailadres halen: abc123@scan.nooitmeerpostkwijt.nl → abc123
  const scanToken = recipient.split("@")[0].toLowerCase();

  // Gebruiker opzoeken via token
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, subscription_credits, subscription_status")
    .eq("scan_email_token", scanToken)
    .single();

  if (!profile) return NextResponse.json({ error: "Onbekend scan-adres" }, { status: 404 });

  const hasAccess =
    profile.subscription_credits > 0 &&
    (profile.subscription_status === "active" || profile.subscription_status === "trialing");
  if (!hasAccess) return NextResponse.json({ skipped: true });

  // Base64 → Buffer — nooit opslaan, alleen in memory
  const buffer = Buffer.from(data, "base64");
  const isPdf = contentType === "application/pdf";

  // Eerder gescande afzenders ophalen voor consistente categorisering
  const { data: recentDocs } = await admin
    .from("documents")
    .select("afzender, mappad, type")
    .eq("user_id", profile.id)
    .not("afzender", "is", null)
    .not("mappad", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const senderMap = new Map<string, { mappad: string; type: string | null }>();
  for (const doc of recentDocs ?? []) {
    if (doc.afzender && !senderMap.has(doc.afzender)) {
      senderMap.set(doc.afzender, { mappad: doc.mappad, type: doc.type });
    }
  }
  const senderInstruction = senderMap.size > 0
    ? `\n\nBekende afzenders:\n${[...senderMap.entries()]
        .map(([a, { mappad, type }]) => `- ${a} → mappad: ${mappad}${type ? `, type: ${type}` : ""}`)
        .join("\n")}`
    : "";

  // AI-analyse
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const contentBlock = isPdf
    ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data } }
    : { type: "image" as const, source: { type: "base64" as const, media_type: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data } };

  let analysis: Record<string, string>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Analyseer dit document en geef ALLEEN een geldig JSON object terug, zonder uitleg of markdown.

Formaat:
{
  "type": "type document (brief/factuur/polisblad/bankafschrift/contract/garantiebewijs/medisch/overig)",
  "afzender": "naam van de organisatie of persoon",
  "datum": "YYYY-MM-DD of null als onbekend",
  "onderwerp": "max 4 woorden",
  "mappad": "logisch archief-mappad in het Nederlands, bijv. Financiën/Belasting/2024 of Woning/Hypotheek",
  "bestandsnaam": "bestandsnaam zonder extensie, formaat: YYYY-MM-DD_onderwerp_afzender (alles lowercase, spaties als koppelteken)",
  "samenvatting": "één zin die het document beschrijft",
  "actie": "concrete actie die ondernomen moet worden — null als er geen actie vereist is",
  "actie_deadline": "YYYY-MM-DD van de uiterste datum voor de actie, of null",
  "actie_type": "betaling/reageren/aanvragen/registreren/overig — of null als er geen actie is"
}${senderInstruction}`,
          },
        ],
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(match ? match[0] : raw);
  } catch {
    return NextResponse.json({ error: "AI-analyse mislukt" }, { status: 500 });
  }

  const bestandsnaam = analysis.bestandsnaam ?? filename.replace(/\.[^.]+$/, "") ?? "document";
  const ext = isPdf ? ".pdf" : ".jpg";
  const fullFilename = `${bestandsnaam}${ext}`;
  const mappad = analysis.mappad ?? "Overig";

  // Uploaden naar cloud — buffer wordt na deze aanroep vrijgegeven
  let fileUrl: string | null = null;
  let storage: string | null = null;

  const onedriveToken = await getValidAccessToken(profile.id);
  if (onedriveToken) {
    const { data: tokenRow } = await admin.from("onedrive_tokens").select("archive_root").eq("user_id", profile.id).single();
    const archiveRoot = tokenRow?.archive_root ?? "Archief";
    try {
      const { webUrl } = await uploadFileToOneDrive(onedriveToken, `${archiveRoot}/${mappad}/${fullFilename}`, buffer, contentType);
      fileUrl = webUrl;
      storage = "onedrive";
    } catch { /* ga door naar Dropbox */ }
  }

  if (!fileUrl) {
    let dropboxToken = await getValidDropboxToken(profile.id);
    if (dropboxToken) {
      const { data: tokenRow } = await admin.from("dropbox_tokens").select("archive_root").eq("user_id", profile.id).single();
      const archiveRoot = tokenRow?.archive_root ?? "Archief";
      try {
        const result = await uploadFileToDropbox(dropboxToken, `${archiveRoot}/${mappad}/${fullFilename}`, buffer, contentType);
        fileUrl = result.webUrl;
        storage = "dropbox";
      } catch (err) {
        if ((err as Error & { status?: number }).status === 401) {
          const refreshed = await forceRefreshDropboxToken(profile.id);
          if (refreshed) {
            try {
              const result = await uploadFileToDropbox(refreshed, `${archiveRoot}/${mappad}/${fullFilename}`, buffer, contentType);
              fileUrl = result.webUrl;
              storage = "dropbox";
            } catch { /* upload mislukt */ }
          }
        }
      }
    }
  }

  // Metadata opslaan
  await admin.from("documents").insert({
    user_id: profile.id,
    bestandsnaam: fullFilename,
    type: analysis.type ?? null,
    afzender: analysis.afzender ?? null,
    datum: analysis.datum ?? null,
    onderwerp: analysis.onderwerp ?? null,
    mappad: mappad ?? null,
    samenvatting: analysis.samenvatting ?? null,
    file_url: fileUrl,
    storage: storage ?? "email",
  });

  if (analysis.actie) {
    await admin.from("document_actions").insert({
      user_id: profile.id,
      actie: analysis.actie,
      deadline: analysis.actie_deadline ?? null,
      actie_type: analysis.actie_type ?? null,
      document_naam: fullFilename,
      afzender: analysis.afzender ?? null,
      mappad: mappad ?? null,
      file_url: fileUrl,
      status: "open",
    });
  }

  await admin
    .from("profiles")
    .update({ subscription_credits: profile.subscription_credits - 1 })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true, afzender: analysis.afzender, actie: analysis.actie ?? null });
}
