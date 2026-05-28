import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
  contract_type?: string;
  contract_time?: string;
}

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  created: string;
  scope: "nl" | "remote" | "international";
  contractType: string;
}

interface ProfileData {
  titles: string[];
  skills: string[];
  experience: string;
  summary: string;
}

function deriveContractType(job: AdzunaJob): string {
  const ct = (job.contract_type ?? "").toLowerCase();
  const ctime = (job.contract_time ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();
  const desc = (job.description ?? "").toLowerCase();

  if (ct === "permanent" || title.includes("permanent") || title.includes(" vast ") || desc.includes("vast dienstverband")) return "permanent";
  if (ctime === "part_time" || title.includes("part-time") || title.includes("part time")) return "part-time";
  if (ct === "contract" || title.includes("freelance") || title.includes("zzp") || title.includes("interim") || desc.includes("freelance")) return "freelance";
  return "contract";
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  const fmt = (n: number) => n >= 1000 ? `€${Math.round(n / 1000)}k` : `€${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `vanaf ${fmt(min)}`;
  if (max) return `t/m ${fmt(max)}`;
}

async function searchAdzuna(
  country: string,
  what: string,
  scope: Vacancy["scope"]
): Promise<Vacancy[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    results_per_page: "15",
    sort_by: "date",
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[cv-loopbaan] Adzuna ${country} "${what}" → ${res.status}:`, body.slice(0, 200));
      return [];
    }
    const data = await res.json();
    const jobs: AdzunaJob[] = data.results ?? [];
    console.log(`[cv-loopbaan] Adzuna ${country} "${what}" → ${jobs.length} results`);
    return jobs.map((j) => ({
      id: `${scope}-${j.id}`,
      title: j.title,
      company: j.company?.display_name ?? "Onbekend",
      location: j.location?.display_name ?? "",
      description: j.description?.slice(0, 220) ?? "",
      url: j.redirect_url,
      salary: formatSalary(j.salary_min, j.salary_max),
      created: j.created,
      scope,
      contractType: deriveContractType(j),
    }));
  } catch (err) {
    console.error(`[cv-loopbaan] Adzuna ${country} fetch error:`, err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 2) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const { profileText, lang } = await req.json();
  if (!profileText?.trim()) return NextResponse.json({ error: "Geen profiel opgegeven" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Run CV generation and profile analysis in parallel
  const cvPrompt = lang === "nl"
    ? `Maak een professioneel CV op basis van dit LinkedIn profiel. Stijl: uitgebreid en volledig (2 pagina's, alle ervaring).

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
    : `Create a professional CV based on this LinkedIn profile. Style: comprehensive and complete (2 pages, all experience).

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

  const profileAnalysisPrompt = `Analyseer dit CV voor een vacaturezoeker gericht op freelance/ZZP werk.
Geef ALLEEN een JSON object terug, zonder extra tekst of markdown:
{
  "titles": ["meest relevante Engelstalige functietitel (kort, 1-3 woorden)", "tweede optie", "derde optie"],
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "bijv. 8 jaar",
  "summary": "1-zin samenvatting van het profiel in het Nederlands"
}

Houd de titels kort en generiek zodat ze goed werken als zoekterm. Bijv. "Developer" niet "Senior Full-Stack JavaScript Developer".

Profiel:
${profileText.slice(0, 3000)}`;

  const [cvMessage, analysisMessage] = await Promise.all([
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: cvPrompt }],
    }),
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: profileAnalysisPrompt }],
    }),
  ]);

  // Parse CV
  const cvContent = cvMessage.content[0];
  if (cvContent.type !== "text") return NextResponse.json({ error: "CV generatie mislukt" }, { status: 500 });

  let cv: object;
  try {
    const cleaned = cvContent.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "CV kon niet worden gegenereerd" }, { status: 500 });
    cv = JSON.parse(match[0]);
  } catch (err) {
    console.error("[cv-loopbaan] CV JSON parse error:", err);
    return NextResponse.json({ error: "CV kon niet worden verwerkt" }, { status: 500 });
  }

  // Parse profile analysis
  const analysisContent = analysisMessage.content[0];
  if (analysisContent.type !== "text") return NextResponse.json({ error: "Profielanalyse mislukt" }, { status: 500 });

  let profileData: ProfileData;
  try {
    const cleaned = analysisContent.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    profileData = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Kon profiel niet verwerken" }, { status: 500 });
  }

  console.log("[cv-loopbaan] Profile extracted:", profileData.titles, profileData.skills);

  // Search vacancies (returns empty array if ADZUNA keys missing)
  let allVacancies: Vacancy[] = [];

  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    const title = profileData.titles[0] ?? "professional";
    const title2 = profileData.titles[1] ?? title;
    const title3 = profileData.titles[2] ?? title2;

    const [nlJobs1, nlJobs2, nlJobs3, beJobs, deJobs, remoteJobs1, remoteJobs2, intJobs1, intJobs2] = await Promise.all([
      searchAdzuna("nl", title, "nl"),
      searchAdzuna("nl", title2, "nl"),
      searchAdzuna("nl", `${title3} freelance`, "nl"),
      searchAdzuna("be", title, "nl"),
      searchAdzuna("de", title, "international"),
      searchAdzuna("gb", `${title} remote`, "remote"),
      searchAdzuna("gb", `${title2} remote`, "remote"),
      searchAdzuna("gb", `${title} contract`, "international"),
      searchAdzuna("gb", `${title3} freelance`, "international"),
    ]);

    const seen = new Set<string>();
    for (const v of [...nlJobs1, ...nlJobs2, ...nlJobs3, ...beJobs, ...deJobs, ...remoteJobs1, ...remoteJobs2, ...intJobs1, ...intJobs2]) {
      const key = `${v.title.toLowerCase()}-${v.company.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        allVacancies.push(v);
      }
    }

    console.log(`[cv-loopbaan] Total unique vacancies: ${allVacancies.length}`);
  } else {
    console.warn("[cv-loopbaan] Adzuna keys missing, skipping vacancy search");
  }

  // Charge 2 credits
  await supabase.rpc("decrement_credits", { user_id: user.id });
  await supabase.rpc("decrement_credits", { user_id: user.id });
  await logUsage(user.id, "cv-loopbaan", 2);

  return NextResponse.json({ cv, vacancies: allVacancies, profile: profileData });
}
