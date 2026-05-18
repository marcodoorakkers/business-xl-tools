import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });
  }

  const { transcript, attendees, meetingName, lang } = await req.json();
  if (!transcript) return NextResponse.json({ error: "Geen transcript" }, { status: 400 });

  const attCtx = attendees?.length
    ? lang === "en"
      ? `\n\nKnown attendees: ${attendees.join(", ")}`
      : `\n\nBekende deelnemers: ${attendees.join(", ")}`
    : "";

  const prompt = lang === "en"
    ? `You are a professional meeting secretary. Analyse the transcript and produce structured meeting notes in English.${attCtx}\n\nTranscript:\n"""\n${transcript}\n"""\n\nReturn ONLY valid JSON (no markdown, no explanation):\n{"summary":"2-3 sentences","attendees":["Name"],"topics":["Topic"],"decisions":["Decision"],"actions":[{"action":"...","who":"name","when":"..."}],"next_meeting":"Date or Not yet scheduled"}\nEmpty fields: [] or "".`
    : `Je bent een professionele notulist. Analyseer het transcript en maak gestructureerde notulen in het Nederlands.${attCtx}\n\nTranscript:\n"""\n${transcript}\n"""\n\nGeef ALLEEN geldig JSON terug (geen markdown, geen uitleg):\n{"samenvatting":"2-3 zinnen","aanwezigen":["Naam"],"besproken_punten":["Punt"],"beslissingen":["Beslissing"],"actiepunten":[{"actie":"...","wie":"naam","wanneer":"..."}],"volgende_vergadering":"Datum of Nog niet gepland"}\nLege velden: [] of "".`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "Onverwacht antwoord" }, { status: 500 });

  try {
    const clean = content.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const notes = JSON.parse(clean);

    // Deduct 1 credit
    await supabase.rpc("decrement_credits", { user_id: user.id });

    // Log usage
    await supabase.from("usage_logs").insert({
      user_id: user.id,
      tool: "meeting-memo",
      credits_used: 1,
    });

    const now = new Date();
    notes._meta = {
      title: meetingName || (lang === "en" ? "Meeting" : "Vergadering"),
      date: now.toLocaleDateString(lang === "en" ? "en-GB" : "nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: now.toLocaleTimeString(lang === "en" ? "en-GB" : "nl-NL", { hour: "2-digit", minute: "2-digit" }),
    };

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: "Kon notulen niet verwerken", raw: content.text }, { status: 500 });
  }
}
