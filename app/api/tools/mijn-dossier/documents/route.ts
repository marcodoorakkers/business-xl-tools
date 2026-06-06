import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tools/mijn-dossier/documents?q=...&gezinslid=...&type=...&all=1
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const gezinslid = searchParams.get("gezinslid")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const jaar = searchParams.get("jaar")?.trim() ?? "";
  const allDocs = searchParams.get("all") === "1";
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const PAGE_SIZE = 20;

  let query = supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!allDocs) {
    query = query.range(offset, offset + PAGE_SIZE);
  }

  if (q) {
    query = query.or(
      `afzender.ilike.%${q}%,samenvatting.ilike.%${q}%,onderwerp.ilike.%${q}%,mappad.ilike.%${q}%,bestandsnaam.ilike.%${q}%`
    );
  }
  if (gezinslid) {
    query = query.eq("gezinslid", gezinslid);
  }
  if (type) {
    query = query.eq("type", type);
  }
  if (jaar) {
    query = query.gte("datum", `${jaar}-01-01`).lte("datum", `${jaar}-12-31`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (allDocs) {
    return NextResponse.json({ documents: data ?? [], hasMore: false });
  }

  const all = data ?? [];
  const hasMore = all.length > PAGE_SIZE;
  return NextResponse.json({ documents: hasMore ? all.slice(0, PAGE_SIZE) : all, hasMore });
}

// POST /api/tools/mijn-dossier/documents
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await req.json();
  const { bestandsnaam, type, afzender, datum, onderwerp, mappad, gezinslid, samenvatting, file_url, storage, actie } = body;

  if (!bestandsnaam) return NextResponse.json({ error: "Bestandsnaam vereist" }, { status: 400 });

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      bestandsnaam,
      type: type ?? null,
      afzender: afzender ?? null,
      datum: datum ?? null,
      onderwerp: onderwerp ?? null,
      mappad: mappad ?? null,
      gezinslid: gezinslid ?? null,
      samenvatting: samenvatting ?? null,
      file_url: file_url ?? null,
      storage: storage ?? "local",
      actie: actie ?? null,
      actie_gedaan: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ document: data });
}

// PATCH /api/tools/mijn-dossier/documents?id=...
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID vereist" }, { status: 400 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if ("mappad" in body) updates.mappad = body.mappad || null;
  if ("actie_gedaan" in body) updates.actie_gedaan = Boolean(body.actie_gedaan);
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Geen wijzigingen" }, { status: 400 });

  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/tools/mijn-dossier/documents?id=...
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID vereist" }, { status: 400 });

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
