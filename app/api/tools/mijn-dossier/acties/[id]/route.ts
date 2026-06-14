import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const valid = ["open", "gedaan", "overgeslagen"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });

  // In privacy-modus: afgevinkte acties direct verwijderen (geen spoor in DB)
  if (status === "gedaan" || status === "overgeslagen") {
    const { data: settings } = await supabase
      .from("archive_settings")
      .select("privacy_mode")
      .eq("user_id", user.id)
      .single();
    if (settings?.privacy_mode === "none") {
      const { error } = await supabase
        .from("document_actions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, deleted: true });
    }
  }

  const { error } = await supabase
    .from("document_actions")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("document_actions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
