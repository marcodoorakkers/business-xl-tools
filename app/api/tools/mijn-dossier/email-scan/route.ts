import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { getValidAccessToken, uploadFileToOneDrive } from "@/lib/onedrive";
import { getValidDropboxToken, forceRefreshDropboxToken, uploadFileToDropbox } from "@/lib/dropbox";
import { convertToPdf } from "@/lib/convert-to-pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Cloudflare Worker stuurt een gedeeld secret mee
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.CLOUDFLARE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    recipient: string;
    from?: string;
    subject?: string;
    filename: string;
    contentType: string;
    data: string; // base64
    isEmailBody?: boolean;
  };

  const { recipient, from, subject, filename, contentType, data, isEmailBody } = body;
  if (!recipient || !data) {
    return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });
  }

  // Token uit het e-mailadres halen: abc123@scan.nooitmeerpostkwijt.nl → abc123
  const scanToken = recipient.split("@")[0].toLowerCase();

  // Gebruiker opzoeken via token
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, subscription_status")
    .eq("scan_email_token", scanToken)
    .single();

  if (!profile) return NextResponse.json({ error: "Onbekend scan-adres" }, { status: 404 });

  const hasAccess =
    profile.subscription_status === "active" || profile.subscription_status === "trialing";
  if (!hasAccess) return NextResponse.json({ skipped: true });

  // Base64 → Buffer → altijd omzetten naar PDF — nooit opslaan, alleen in memory
  const rawBuffer = Buffer.from(data, "base64");
  const pdfBuffer = await convertToPdf(rawBuffer, contentType);
  const pdfBase64 = pdfBuffer.toString("base64");

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

  // Gezinsleden ophalen
  const { data: familyRows } = await admin
    .from("archive_family_members")
    .select("name, full_name")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });
  const familyMemberNames = (familyRows ?? []).map((r: { name: string }) => r.name);

  // Historische gezinslid per afzender ophalen
  const { data: gezinslidDocs } = await admin
    .from("documents")
    .select("afzender, gezinslid")
    .eq("user_id", profile.id)
    .not("afzender", "is", null)
    .not("gezinslid", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const gezinslidMap = new Map<string, string>();
  for (const doc of gezinslidDocs ?? []) {
    if (doc.afzender && doc.gezinslid && !gezinslidMap.has(doc.afzender)) {
      gezinslidMap.set(doc.afzender, doc.gezinslid);
    }
  }

  const emailContext = [
    from ? `Afkomstig van e-mailadres: ${from}` : null,
    subject ? `Onderwerp van de e-mail: ${subject}` : null,
  ].filter(Boolean).join("\n");

  const familyInstruction = familyMemberNames.length > 0
    ? `\n\nDe gezinsleden zijn:\n${(familyRows ?? []).map((r: { name: string; full_name?: string | null }) =>
        r.full_name ? `- ${r.name} (volledige naam: ${r.full_name})` : `- ${r.name}`
      ).join("\n")}\nVoeg een veld 'gezinslid' toe met de korte naam (bijv. "${familyMemberNames[0]}") van de meest waarschijnlijke ontvanger. Gebruik hiervoor (in volgorde van prioriteit): naam/initialen/adres op het document, onderwerp van de e-mail, bekende afzender-gezinslid koppeling. Geef null als het onduidelijk is.${
        gezinslidMap.size > 0
          ? `\n\nBekende afzender → gezinslid koppelingen:\n${[...gezinslidMap.entries()].map(([a, g]) => `- ${a} → ${g}`).join("\n")}`
          : ""
      }${emailContext ? `\n\nE-mailcontext:\n${emailContext}` : ""}`
    : "";

  // AI-analyse — altijd PDF na conversie, altijd document block
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const contentBlock = { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 } };

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
  "afzender": "officiële naam van de organisatie of persoon. Gebruik altijd de gestandaardiseerde naam: 'Belastingdienst' (nooit 'De Belastingdienst' of 'Belasting'), 'DUO' (nooit 'Dienst Uitvoering Onderwijs'), 'UWV' (nooit 'Uitvoeringsinstituut Werknemersverzekeringen'), 'CAK', 'SVB' (nooit 'Sociale Verzekeringsbank'), 'RDW' (nooit 'Rijksdienst voor het Wegverkeer'), 'RVO' (nooit 'Rijksdienst voor Ondernemend Nederland'). Voor gemeenten: 'Gemeente [Naam]'. Voor banken: gebruik de handelsnaam zoals 'ING', 'Rabobank', 'ABN AMRO', 'SNS'.",
  "datum": "YYYY-MM-DD of null als onbekend",
  "onderwerp": "max 4 woorden",
  "mappad": "altijd exact dit formaat: Afzender/Onderwerp/Jaartal — bijv. Belastingdienst/Omzetbelasting/2026 of Gemeente Amsterdam/Parkeervergunning/2025. Gebruik de officiële naam van de afzender, een kort onderwerp (max 2 woorden), en het jaar van het document.",
  "bestandsnaam": "bestandsnaam zonder extensie, formaat: YYYY-MM-DD_onderwerp_afzender (alles lowercase, spaties als koppelteken)",
  "samenvatting": "één zin die het document beschrijft",
  "actie": "concrete actie die ondernomen moet worden — null als er geen actie vereist is",
  "actie_deadline": "YYYY-MM-DD van de uiterste datum voor de actie, of null",
  "actie_type": "betaling/reageren/aanvragen/registreren/overig — of null als er geen actie is"
}${senderInstruction}${familyInstruction}`,
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
  const fullFilename = `${bestandsnaam}.pdf`;
  const matchedGezinslid = analysis.gezinslid
    ? (familyMemberNames.find(n => n === analysis.gezinslid) ??
       familyMemberNames.find(n => n.toLowerCase().startsWith(analysis.gezinslid.toLowerCase() + " ") ||
                                   n.toLowerCase().startsWith(analysis.gezinslid.toLowerCase() + "(")) ??
       null)
    : null;
  const gezinslid = matchedGezinslid;

  // Mapstructuur instelling ophalen
  const { data: archiveSettings } = await admin
    .from("archive_settings")
    .select("folder_structure")
    .eq("user_id", profile.id)
    .single();
  const folderStructure = archiveSettings?.folder_structure ?? "by_subject";

  const person = folderStructure === "by_person" ? (gezinslid ?? "Gemeenschappelijk") : null;
  const mappad = person
    ? `${person}/${analysis.mappad ?? "Overig"}`
    : (analysis.mappad ?? "Overig");

  // Uploaden naar cloud — buffer wordt na deze aanroep vrijgegeven
  let fileUrl: string | null = null;
  let storage: string | null = null;

  const onedriveToken = await getValidAccessToken(profile.id);
  if (onedriveToken) {
    const { data: tokenRow } = await admin.from("onedrive_tokens").select("archive_root").eq("user_id", profile.id).single();
    const archiveRoot = tokenRow?.archive_root ?? "MijnDossier";
    try {
      const { webUrl } = await uploadFileToOneDrive(onedriveToken, `${archiveRoot}/${mappad}/${fullFilename}`, pdfBuffer, "application/pdf");
      fileUrl = webUrl;
      storage = "onedrive";
    } catch { /* ga door naar Dropbox */ }
  }

  if (!fileUrl) {
    let dropboxToken = await getValidDropboxToken(profile.id);
    if (dropboxToken) {
      const { data: tokenRow } = await admin.from("dropbox_tokens").select("archive_root").eq("user_id", profile.id).single();
      const archiveRoot = tokenRow?.archive_root ?? "MijnDossier";
      try {
        const result = await uploadFileToDropbox(dropboxToken, `${archiveRoot}/${mappad}/${fullFilename}`, pdfBuffer, "application/pdf");
        fileUrl = result.webUrl;
        storage = "dropbox";
      } catch (err) {
        if ((err as Error & { status?: number }).status === 401) {
          const refreshed = await forceRefreshDropboxToken(profile.id);
          if (refreshed) {
            try {
              const result = await uploadFileToDropbox(refreshed, `${archiveRoot}/${mappad}/${fullFilename}`, pdfBuffer, "application/pdf");
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
    gezinslid: gezinslid,
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

  return NextResponse.json({ ok: true, afzender: analysis.afzender, actie: analysis.actie ?? null });
}
