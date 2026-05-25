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
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand meegegeven" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const isPdf = file.type === "application/pdf";

  const contentBlock = isPdf
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: (file.type || "image/jpeg") as ImageMediaType,
          data: base64,
        },
      };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
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
  "mappad": "logisch archief-mappad in het Nederlands, bijv. Financiën/Belasting/2024 of Woning/Hypotheek of Zorg/Verzekering",
  "bestandsnaam": "bestandsnaam zonder extensie, formaat: YYYY-MM-DD_onderwerp_afzender (alles lowercase, spaties als koppelteken)",
  "samenvatting": "één zin die het document beschrijft"
}`,
          },
        ],
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  let result: Record<string, string>;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return NextResponse.json({ error: "AI kon het document niet analyseren. Probeer een duidelijkere scan." }, { status: 500 });
  }

  await supabase.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
  await logUsage(user.id, "brief-archief", 1);

  return NextResponse.json(result);
}
