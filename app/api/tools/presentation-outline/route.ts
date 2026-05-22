import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const { topic, duration, audience, goal, style } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Onderwerp is verplicht" }, { status: 400 });
  if (!duration || typeof duration !== "number") return NextResponse.json({ error: "Duur is verplicht" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Je bent een presentatie-expert. Maak een volledige presentatie-outline op basis van de volgende gegevens.

Onderwerp: ${topic}
Duur: ${duration} minuten
${audience ? `Doelgroep: ${audience}` : ""}
${goal ? `Doel: ${goal}` : ""}
${style ? `Stijl: ${style}` : ""}

Maak een logische slideopbouw passend bij de duur (reken op gemiddeld 2-3 minuten per slide).
Geef ALLEEN een JSON object terug, zonder markdown of uitleg:
{
  "title": "Presentatietitel",
  "totalSlides": number,
  "estimatedMinutes": number,
  "slides": [
    {
      "number": 1,
      "type": "titel" | "agenda" | "inhoud" | "afsluiting" | "vragen",
      "title": "Slide titel",
      "bullets": ["punt 1", "punt 2", "punt 3"],
      "speakerTip": "Korte tip voor de spreker"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") return NextResponse.json({ error: "Onverwacht antwoord van AI" }, { status: 500 });

    const cleaned = content.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[presentation-outline] No JSON found in response:", content.text.slice(0, 200));
      return NextResponse.json({ error: "Outline kon niet worden gegenereerd. Probeer een korter onderwerp." }, { status: 500 });
    }

    const outline = JSON.parse(match[0]);

    await supabase.rpc("decrement_credits", { user_id: user.id });
    const { error: logErr } = await supabase.from("usage_logs").insert({ user_id: user.id, tool: "presentation-outline", credits_used: 1 });
    if (logErr) console.error("[presentation-outline] usage_logs insert failed:", logErr.message);

    return NextResponse.json(outline);
  } catch (err) {
    console.error("[presentation-outline] Error:", err);
    return NextResponse.json({ error: "Er is een fout opgetreden. Probeer het opnieuw." }, { status: 500 });
  }
}
