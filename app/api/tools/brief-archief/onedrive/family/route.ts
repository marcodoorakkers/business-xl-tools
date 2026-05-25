import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("archive_family_members")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ familyMembers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("archive_family_members")
    .insert({ user_id: user.id, name: name.trim() })
    .select("id, name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });

  const admin = createAdminClient();
  await admin
    .from("archive_family_members")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
