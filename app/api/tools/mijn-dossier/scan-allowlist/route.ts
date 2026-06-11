import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("scan_email_allowlist")
    .select("id, email, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ allowlist: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scan_email_allowlist")
    .insert({ user_id: user.id, email: email.toLowerCase().trim() })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Al toegevoegd" }, { status: 409 });
    return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  const { error } = await supabase
    .from("scan_email_allowlist")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
