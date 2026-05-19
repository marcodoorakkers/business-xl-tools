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

  const { persons, dietary, cookTime, fridge, days } = await req.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const dietaryStr = dietary?.length > 0 ? dietary.join(", ") : "geen";
  const cookTimeStr = cookTime === "snel" ? "maximaal 30 minuten" : cookTime === "normaal" ? "ongeveer 45 minuten" : "geen voorkeur";
  const fridgeStr = fridge?.trim() ? `Wat al in huis is: ${fridge.trim()}.` : "";
  const daysStr = (days as string[]).join(", ");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Maak een gevarieerd weekmenu voor de volgende dagen: ${daysStr}. Voor ${persons} persoon/personen.
Dieetwensen: ${dietaryStr}
Kooktijd voorkeur: ${cookTimeStr}
${fridgeStr}

Geef ALLEEN een JSON object terug, zonder extra tekst, uitleg of markdown. Exact dit formaat:
{
  "week": [
    {
      "day": "Maandag",
      "dish": "Naam van het gerecht",
      "description": "Korte smakelijke omschrijving (1 zin)",
      "time": "30 min",
      "recipe": "1. Stap één\\n2. Stap twee\\n3. Stap drie (5-8 stappen, beknopt maar volledig)",
      "ingredients": [
        { "item": "2 uien", "category": "Groenten & fruit" },
        { "item": "300g kipfilet", "category": "Vlees, vis & vleesvervanger" }
      ]
    }
  ]
}

Gebruik alleen deze categorieën voor ingrediënten: "Groenten & fruit", "Vlees, vis & vleesvervanger", "Zuivel & eieren", "Droogwaren & conserven", "Sauzen, kruiden & oliën", "Brood & bakkerij", "Overig".
Geef hoeveelheden op voor ${persons} persoon/personen. Houd de gerechten realistisch en gevarieerd.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "Onverwacht antwoord" }, { status: 500 });

  try {
    const cleaned = content.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Kon weekmenu niet genereren" }, { status: 500 });

    const plan = JSON.parse(jsonMatch[0]);

    await supabase.rpc("decrement_credits", { user_id: user.id });
    await supabase.from("usage_logs").insert({ user_id: user.id, tool: "dinner-planner", credits_used: 1 });

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Kon weekmenu niet verwerken" }, { status: 500 });
  }
}
