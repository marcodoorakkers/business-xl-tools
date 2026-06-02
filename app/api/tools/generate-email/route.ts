import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transcript, language = "nl", retranslate = false } = await req.json();
  if (!transcript) return NextResponse.json({ error: "Geen transcript" }, { status: 400 });

  const languageNames: Record<string, string> = {
    nl: "Nederlands",
    en: "English",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
  };
  const outputLanguage = languageNames[language] ?? "Nederlands";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Je krijgt een gesproken bericht dat iemand wil omzetten naar een e-mail.
Verwerk ALLE inhoud uit het gesproken bericht in de mail — laat niets weg en vat niet samen.
Maak er een nette, professionele e-mail van met correcte alinea's en zinsbouw.
Schrijf de mail ALTIJD in het ${outputLanguage}, ongeacht de taal van het gesproken bericht.

Geef ALLEEN een JSON object terug, zonder extra tekst, uitleg of markdown. Exact dit formaat:
{"subject": "onderwerp hier", "body": "volledige mailtekst hier"}

Gesproken bericht:
${transcript}`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "Onverwacht antwoord" }, { status: 500 });

  try {
    const cleaned = content.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Kon mail niet genereren" }, { status: 500 });

    const email = JSON.parse(jsonMatch[0]);

    // Deduct 2 credits — skip for re-translation (same transcript, different language)
    if (!retranslate) {
      await supabase.rpc("decrement_credits", { user_id: user.id });
      await supabase.rpc("decrement_credits", { user_id: user.id });
      await logUsage(user.id, "voice-mail", 1);
    }

    return NextResponse.json(email);
  } catch {
    return NextResponse.json({ error: "Kon mail niet verwerken" }, { status: 500 });
  }
}
