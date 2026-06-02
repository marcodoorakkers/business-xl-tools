import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
const RATE_LIMIT = 5;          // max verzoeken per window
const WINDOW_MINUTES = 10;     // window in minuten

async function checkRateLimit(ipHash: string): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data } = await admin
    .from("demo_rate_limits")
    .select("count, window_start")
    .eq("ip_hash", ipHash)
    .single();

  if (!data) {
    // Eerste verzoek van dit IP
    await admin.from("demo_rate_limits").insert({ ip_hash: ipHash, count: 1, window_start: new Date().toISOString() });
    return true;
  }

  if (data.window_start < windowStart) {
    // Window verlopen — reset
    await admin.from("demo_rate_limits").update({ count: 1, window_start: new Date().toISOString() }).eq("ip_hash", ipHash);
    return true;
  }

  if (data.count >= RATE_LIMIT) {
    return false; // Limiet bereikt
  }

  await admin.from("demo_rate_limits").update({ count: data.count + 1 }).eq("ip_hash", ipHash);
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting — IP wordt gehasht, nooit rauw opgeslagen
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").substring(0, 16);

  const allowed = await checkRateLimit(ipHash);
  if (!allowed) {
    return NextResponse.json(
      { error: `Te veel verzoeken. Probeer het over ${WINDOW_MINUTES} minuten opnieuw.` },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand meegestuurd" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Bestand te groot (max 5 MB)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Alleen PDF of afbeelding (JPEG, PNG, WebP)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const isPdf = file.type === "application/pdf";

  const contentBlock = isPdf
    ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
    : { type: "image" as const, source: { type: "base64" as const, media_type: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 } };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let result: Record<string, string | null>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Analyseer dit document en geef ALLEEN een geldig JSON object terug, zonder uitleg of markdown.

{
  "type": "type document (brief/factuur/polisblad/bankafschrift/contract/garantiebewijs/medisch/overig)",
  "afzender": "naam van de organisatie of persoon",
  "datum": "YYYY-MM-DD of null",
  "onderwerp": "max 5 woorden",
  "samenvatting": "één zin die het document beschrijft",
  "actie": "concrete actie die ondernomen moet worden, of null",
  "actie_deadline": "YYYY-MM-DD of null",
  "mappad": "logisch mappad, bijv. Financiën/Belasting/2024 of Zakelijk/Verzekeringen"
}`,
          },
        ],
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(match ? match[0] : raw);
  } catch {
    return NextResponse.json({ error: "Analyse mislukt — probeer een duidelijker document" }, { status: 500 });
  }

  return NextResponse.json(result);
}
