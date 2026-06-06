import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile || !["active", "trialing"].includes(profile.subscription_status ?? "")) {
    return NextResponse.json({ error: "Geen actief abonnement" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  let query = supabase
    .from("documents")
    .select("id, afzender, type, onderwerp, datum, samenvatting, gezinslid")
    .eq("user_id", user.id)
    .is("mappad", null)
    .limit(50);

  if (ids?.length) {
    query = query.in("id", ids);
  }

  const { data: docs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!docs?.length) return NextResponse.json({ updated: 0, results: [] });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const currentYear = new Date().getFullYear();
  const docsJson = JSON.stringify(
    docs.map((d) => ({
      id: d.id,
      afzender: d.afzender,
      type: d.type,
      onderwerp: d.onderwerp,
      datum: d.datum,
      samenvatting: d.samenvatting,
    }))
  );

  let mappads: { id: string; mappad: string }[] = [];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Genereer een mappad voor elk document. Formaat: Afzender/Onderwerp/Jaar.

Regels:
- Gebruik de exacte afzendernaam zoals opgegeven
- Onderwerp: max 2 woorden, beschrijvend
- Jaar: gebaseerd op datum, of ${currentYear} als onbekend
- Geef ALLEEN een JSON array terug: [{"id":"...","mappad":"..."},...]

Documenten:
${docsJson}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    mappads = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
  } catch {
    return NextResponse.json({ error: "AI-analyse mislukt" }, { status: 500 });
  }

  let updated = 0;
  for (const { id, mappad } of mappads) {
    if (!id || !mappad || typeof mappad !== "string") continue;
    const { error: updateError } = await supabase
      .from("documents")
      .update({ mappad })
      .eq("id", id)
      .eq("user_id", user.id);
    if (!updateError) updated++;
  }

  return NextResponse.json({ updated, results: mappads });
}
