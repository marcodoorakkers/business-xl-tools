import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });

  const fileType = file.type;
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  if (!isImage && !isPdf) {
    return NextResponse.json({ error: "Alleen PDF en afbeeldingen (jpg, png) worden ondersteund" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let extractedText = "";

  if (isImage) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Dit is een foto van notulen of vergaderaantekeningen. Extraheer alle tekst zo volledig en nauwkeurig mogelijk. Behoud de structuur (kopjes, lijsten, actiepunten). Geef alleen de tekst terug, geen extra uitleg.",
          },
        ],
      }],
    });

    const content = message.content[0];
    if (content.type !== "text") return NextResponse.json({ error: "Kon tekst niet extraheren uit afbeelding" }, { status: 500 });
    extractedText = content.text;

  } else {
    // PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    extractedText = data.text?.trim();
    if (!extractedText) return NextResponse.json({ error: "Kon geen tekst vinden in de PDF" }, { status: 400 });
  }

  return NextResponse.json({ text: extractedText });
}
