import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const [{ count: docCount }, { count: actionCount }] = await Promise.all([
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("document_actions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return NextResponse.json({ documents: docCount ?? 0, actions: actionCount ?? 0 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { type } = await req.json();

  if (type === "metadata") {
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("documents").update({ samenvatting: null, actie: null, actie_gedaan: false }).eq("user_id", user.id),
      supabase.from("document_actions").delete().eq("user_id", user.id),
    ]);
    if (e1 || e2) return NextResponse.json({ error: "Wissen mislukt" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "all") {
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("documents").delete().eq("user_id", user.id),
      supabase.from("document_actions").delete().eq("user_id", user.id),
    ]);
    if (e1 || e2) return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ongeldig type" }, { status: 400 });
}
