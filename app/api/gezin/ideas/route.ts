import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, user_id, title, description, status, votes, created_at")
    .eq("product", "nmmpk")
    .order("votes", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ideas) return NextResponse.json([]);

  if (!user) {
    return NextResponse.json(ideas.map((i) => ({ ...i, hasVoted: false })));
  }

  const { data: votes } = await supabase
    .from("idea_votes")
    .select("idea_id")
    .eq("user_id", user.id);

  const votedIds = new Set((votes ?? []).map((v) => v.idea_id));
  return NextResponse.json(ideas.map((i) => ({ ...i, hasVoted: votedIds.has(i.id) })));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; description?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Titel is verplicht" }, { status: 400 });

  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: title.trim().slice(0, 100),
      description: description ? description.trim().slice(0, 500) : null,
      status: "nieuw",
      votes: 0,
      product: "nmmpk",
    })
    .select("id, user_id, title, description, status, votes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...idea, hasVoted: false }, { status: 201 });
}
