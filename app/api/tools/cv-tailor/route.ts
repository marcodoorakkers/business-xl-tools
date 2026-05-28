import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 1) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const { profileText, jobDescription, lang } = await req.json();
  if (!profileText?.trim()) return NextResponse.json({ error: "Geen profiel opgegeven" }, { status: 400 });
  if (!jobDescription?.trim()) return NextResponse.json({ error: "Geen vacaturetekst opgegeven" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = lang === "nl"
    ? `Pas dit CV aan op de onderstaande vacature. Benadruk relevante werkervaring en vaardigheden, gebruik trefwoorden uit de vacaturetekst, en houd alle feitelijke informatie intact.

Geef ALLEEN een JSON object terug, zonder extra tekst of markdown:
{
  "name": "Volledige naam",
  "title": "Professionele titel (afgestemd op de vacature)",
  "contact": {
    "email": "email indien beschikbaar",
    "phone": "telefoon indien beschikbaar",
    "location": "stad, land",
    "linkedin": "linkedin url indien beschikbaar"
  },
  "summary": "Krachtige professionele samenvatting gericht op deze vacature (3-4 zinnen)",
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

CV profiel:
${profileText.slice(0, 3000)}

Vacaturetekst:
${jobDescription.slice(0, 2000)}`
    : `Tailor this CV to the job description below. Highlight relevant experience and skills, use keywords from the job posting, and keep all factual information intact.

Return ONLY a JSON object, no extra text or markdown:
{
  "name": "Full name",
  "title": "Professional title (aligned to the job)",
  "contact": {
    "email": "email if available",
    "phone": "phone if available",
    "location": "city, country",
    "linkedin": "linkedin url if available"
  },
  "summary": "Powerful professional summary targeted at this role (3-4 sentences)",
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

CV profile:
${profileText.slice(0, 3000)}

Job description:
${jobDescription.slice(0, 2000)}`;

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
    if (!match) return NextResponse.json({ error: "CV kon niet worden aangepast" }, { status: 500 });

    const cv = JSON.parse(match[0]);

    await supabase.rpc("decrement_credits", { user_id: user.id });
    await logUsage(user.id, "cv-tailor", 1);

    return NextResponse.json({ ...cv, _lang: lang });
  } catch (err) {
    console.error("[cv-tailor] JSON parse error:", err);
    return NextResponse.json({ error: "CV kon niet worden verwerkt" }, { status: 500 });
  }
}
