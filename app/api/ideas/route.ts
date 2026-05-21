import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, user_id, title, description, status, votes, created_at")
    .order("votes", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ideas) {
    return NextResponse.json([]);
  }

  if (!user) {
    const result = ideas.map((idea) => ({ ...idea, hasVoted: false }));
    return NextResponse.json(result);
  }

  const { data: votes } = await supabase
    .from("idea_votes")
    .select("idea_id")
    .eq("user_id", user.id);

  const votedIds = new Set((votes ?? []).map((v) => v.idea_id));

  const result = ideas.map((idea) => ({
    ...idea,
    hasVoted: votedIds.has(idea.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const trimmedTitle = title.trim().slice(0, 100);
  const trimmedDescription = description ? description.trim().slice(0, 500) : null;

  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: trimmedTitle,
      description: trimmedDescription,
      status: "nieuw",
      votes: 0,
    })
    .select("id, user_id, title, description, status, votes, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...idea, hasVoted: false }, { status: 201 });
}
