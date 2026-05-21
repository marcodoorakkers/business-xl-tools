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

  const { profileText, lang, style, jobDescription } = await req.json();
  if (!profileText?.trim()) return NextResponse.json({ error: "Geen profiel opgegeven" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const styleMap: Record<string, string> = {
    compact: lang === "nl" ? "compact en krachtig (max 1 pagina, alleen de highlights)" : "compact and powerful (max 1 page, highlights only)",
    full: lang === "nl" ? "uitgebreid en volledig (2 pagina's, alle ervaring)" : "comprehensive and complete (2 pages, all experience)",
    targeted: lang === "nl" ? "gericht op de meegeleverde vacature (relevante ervaring benadrukken)" : "targeted to the provided job description (emphasize relevant experience)",
  };
  const styleDesc = styleMap[style] ?? "";

  const jobSection = jobDescription?.trim()
    ? (lang === "nl" ? `\n\nVacaturetekst om op te richten:\n${jobDescription.trim()}` : `\n\nJob description to target:\n${jobDescription.trim()}`)
    : "";

  const prompt = lang === "nl"
    ? `Maak een professioneel CV op basis van dit LinkedIn profiel. Stijl: ${styleDesc}.${jobSection}

Geef ALLEEN een JSON object terug, zonder extra tekst of markdown:
{
  "name": "Volledige naam",
  "title": "Professionele titel",
  "contact": {
    "email": "email indien beschikbaar",
    "phone": "telefoon indien beschikbaar",
    "location": "stad, land",
    "linkedin": "linkedin url indien beschikbaar"
  },
  "summary": "Krachtige professionele samenvatting (3-4 zinnen)",
  "experience": [
    {
      "title": "Functietitel",
      "company": "Bedrijfsnaam",
      "period": "jan 2020 – heden",
      "description": ["Bullet punt 1", "Bullet punt 2", "Bullet punt 3"]
    }
  ],
  "education": [
    {
      "degree": "Opleiding",
      "institution": "Instelling",
      "period": "2015 – 2019"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "languages": ["Nederlands (moedertaal)", "Engels (vloeiend)"],
  "certifications": ["Certificaat 1"]
}

LinkedIn profiel:
${profileText.slice(0, 4000)}`
    : `Create a professional CV based on this LinkedIn profile. Style: ${styleDesc}.${jobSection}

Return ONLY a JSON object, no extra text or markdown:
{
  "name": "Full name",
  "title": "Professional title",
  "contact": {
    "email": "email if available",
    "phone": "phone if available",
    "location": "city, country",
    "linkedin": "linkedin url if available"
  },
  "summary": "Powerful professional summary (3-4 sentences)",
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "period": "Jan 2020 – present",
      "description": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "Institution",
      "period": "2015 – 2019"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "languages": ["Dutch (native)", "English (fluent)"],
  "certifications": ["Certificate 1"]
}

LinkedIn profile:
${profileText.slice(0, 4000)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "Onverwacht antwoord" }, { status: 500 });

  try {
    const cleaned = content.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "CV kon niet worden gegenereerd" }, { status: 500 });

    const cv = JSON.parse(match[0]);

    await supabase.rpc("decrement_credits", { user_id: user.id });
    await supabase.from("usage_logs").insert({ user_id: user.id, tool: "cv-builder", credits_used: 1 });

    return NextResponse.json(cv);
  } catch (err) {
    console.error("[cv-builder] JSON parse error:", err);
    return NextResponse.json({ error: "CV kon niet worden verwerkt" }, { status: 500 });
  }
}
