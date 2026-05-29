import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET — alle concepten voor de ingelogde gebruiker
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data, error } = await supabase
    .from("email_drafts")
    .select("id, subject, body, transcript, language, status, created_at")
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — sla een nieuw concept op
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { subject, body, transcript, language } = await request.json();
  if (!subject || !body) return NextResponse.json({ error: "Onderwerp en bericht zijn verplicht" }, { status: 400 });

  const { data, error } = await supabase
    .from("email_drafts")
    .insert({ user_id: user.id, subject, body, transcript: transcript ?? null, language: language ?? "nl" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
