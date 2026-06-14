import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data, error } = await supabase
    .from("document_actions")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json();
  const { actie, deadline, actie_type, document_naam, afzender, mappad, file_url } = body;
  if (!actie) return NextResponse.json({ error: "Actie verplicht" }, { status: 400 });

  const { data, error } = await supabase
    .from("document_actions")
    .insert({
      user_id: user.id,
      actie,
      deadline: deadline ?? null,
      actie_type: actie_type ?? null,
      document_naam: document_naam ?? null,
      afzender: afzender ?? null,
      mappad: mappad ?? null,
      file_url: file_url ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
