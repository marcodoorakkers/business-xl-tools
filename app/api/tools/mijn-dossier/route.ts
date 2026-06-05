import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const formData = await req.formData();

  const familyMembersRaw = formData.get("family_members") as string | null;
  interface FamilyMemberData { name: string; full_name?: string | null }
  let familyData: FamilyMemberData[] = [];
  if (familyMembersRaw) {
    try {
      const parsed = JSON.parse(familyMembersRaw);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
        familyData = parsed.map((n: string) => ({ name: n }));
      } else {
        familyData = parsed;
      }
    } catch { familyData = []; }
  }
  const familyMemberNames = familyData.map(m => m.name);

  // Ondersteuning voor meerdere bestanden (file_0, file_1, ...) én enkel bestand (file)
  const fileCountRaw = formData.get("file_count");
  const fileCount = fileCountRaw ? parseInt(String(fileCountRaw)) : 1;

  const uploadedFiles: File[] = [];
  if (fileCount > 1 || formData.get("file_0")) {
    for (let i = 0; i < fileCount; i++) {
      const f = formData.get(`file_${i}`) as File | null;
      if (f) uploadedFiles.push(f);
    }
  } else {
    const f = formData.get("file") as File | null;
    if (f) uploadedFiles.push(f);
  }

  if (!uploadedFiles.length) return NextResponse.json({ error: "Geen bestand meegegeven" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  // Blokkeer HEIC/HEIF — Claude ondersteunt dit formaat niet
  const unsupported = uploadedFiles.find(f => f.type === "image/heic" || f.type === "image/heif");
  if (unsupported) {
    return NextResponse.json(
      { error: "HEIC/HEIF-foto's worden niet ondersteund. Ga op je iPhone naar Instellingen → Camera → Formaten en kies 'Meest Compatible', dan opnieuw proberen." },
      { status: 415 }
    );
  }

  const contentBlocks = await Promise.all(uploadedFiles.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const isPdf = file.type === "application/pdf";
    const supportedImageTypes: ImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mediaType: ImageMediaType = supportedImageTypes.includes(file.type as ImageMediaType)
      ? (file.type as ImageMediaType)
      : "image/jpeg";
    return isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data: base64 } };
  }));

  // Bekende afzenders ophalen voor consistente categorisering
  const { data: recentDocs } = await supabase
    .from("documents")
    .select("afzender, mappad, type")
    .eq("user_id", user.id)
    .not("afzender", "is", null)
    .not("mappad", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  // Dedupliceer: meest recente mappad per afzender
  const senderMap = new Map<string, { mappad: string; type: string | null }>();
  for (const doc of recentDocs ?? []) {
    if (doc.afzender && !senderMap.has(doc.afzender)) {
      senderMap.set(doc.afzender, { mappad: doc.mappad, type: doc.type });
    }
  }

  const senderInstruction = senderMap.size > 0
    ? `\n\nBekende afzenders van deze gebruiker — gebruik de exacte afzendernaam consistent:\n${
        [...senderMap.entries()]
          .map(([afz, { type }]) => `- ${afz}${type ? ` (type: ${type})` : ""}`)
          .join("\n")
      }`
    : "";

  const familyInstruction =
    familyData.length > 0
      ? `\n\nDe gezinsleden zijn:\n${familyData.map(m => m.full_name ? `- ${m.name} (volledige naam: ${m.full_name})` : `- ${m.name}`).join("\n")}\nVoeg een veld 'gezinslid' toe met de korte naam (bijv. "${familyData[0].name}") van de meest waarschijnlijke ontvanger op basis van naam, initialen of adres op het document. Geef null als het onduidelijk is.`
      : "";

  const pageNote = uploadedFiles.length > 1 ? `\n\nDit document bestaat uit ${uploadedFiles.length} pagina's (hierboven afgebeeld). Analyseer het als één geheel document.` : "";

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            ...contentBlocks,
            {
              type: "text",
              text: `Analyseer dit document en geef ALLEEN een geldig JSON object terug, zonder uitleg of markdown.${pageNote}

Formaat:
{
  "type": "type document (brief/factuur/polisblad/bankafschrift/contract/garantiebewijs/medisch/overig)",
  "afzender": "officiële naam van de organisatie of persoon. Gebruik altijd de gestandaardiseerde naam: 'Belastingdienst' (nooit 'De Belastingdienst' of 'Belasting'), 'DUO' (nooit 'Dienst Uitvoering Onderwijs'), 'UWV' (nooit 'Uitvoeringsinstituut Werknemersverzekeringen'), 'CAK', 'SVB' (nooit 'Sociale Verzekeringsbank'), 'RDW' (nooit 'Rijksdienst voor het Wegverkeer'), 'RVO' (nooit 'Rijksdienst voor Ondernemend Nederland'). Voor gemeenten: 'Gemeente [Naam]'. Voor banken: gebruik de handelsnaam zoals 'ING', 'Rabobank', 'ABN AMRO', 'SNS'.",
  "datum": "YYYY-MM-DD of null als onbekend",
  "onderwerp": "max 4 woorden",
  "mappad": "altijd exact dit formaat: Afzender/Onderwerp/Jaartal — bijv. Belastingdienst/Omzetbelasting/2026 of Gemeente Amsterdam/Parkeervergunning/2025. Gebruik de officiële naam van de afzender, een kort onderwerp (max 2 woorden), en het jaar van het document.",
  "bestandsnaam": "bestandsnaam zonder extensie, formaat: YYYY-MM-DD_onderwerp_afzender (alles lowercase, spaties als koppelteken)",
  "samenvatting": "één zin die het document beschrijft",
  "actie": "concrete actie die ondernomen moet worden, bijv. 'Betaal €156 aan gemeente' of 'Reageer vóór de deadline' — null als er geen actie vereist is",
  "actie_deadline": "YYYY-MM-DD van de uiterste datum voor de actie, of null",
  "actie_type": "betaling/reageren/aanvragen/registreren/overig — of null als er geen actie is"
}${senderInstruction}${familyInstruction}`,
            },
          ],
        },
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: `AI-analyse mislukt: ${msg}` }, { status: 500 });
  }

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  let result: Record<string, string>;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return NextResponse.json({ error: "AI kon het document niet analyseren. Probeer een duidelijkere scan." }, { status: 500 });
  }

  await supabase.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
  await logUsage(user.id, "mijn-dossier", 1);

  return NextResponse.json(result);
}
