import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if vote already exists
  const { data: existingVote } = await supabase
    .from("idea_votes")
    .select("idea_id")
    .eq("idea_id", id)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    // Remove vote
    const { error: deleteError } = await supabase
      .from("idea_votes")
      .delete()
      .eq("idea_id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const { data: idea, error: updateError } = await supabase
      .rpc("decrement_idea_votes", { idea_id: id })
      .select("votes")
      .single();

    // Fallback: manual decrement if RPC not available
    if (updateError) {
      const { data: current } = await supabase
        .from("ideas")
        .select("votes")
        .eq("id", id)
        .single();

      const newVotes = Math.max(0, (current?.votes ?? 1) - 1);

      const { data: updated, error: updateErr2 } = await supabase
        .from("ideas")
        .update({ votes: newVotes })
        .eq("id", id)
        .select("votes")
        .single();

      if (updateErr2) {
        return NextResponse.json({ error: updateErr2.message }, { status: 500 });
      }

      return NextResponse.json({ voted: false, votes: updated?.votes ?? newVotes });
    }

    return NextResponse.json({ voted: false, votes: idea?.votes ?? 0 });
  } else {
    // Add vote
    const { error: insertError } = await supabase
      .from("idea_votes")
      .insert({ idea_id: id, user_id: user.id });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { data: current } = await supabase
      .from("ideas")
      .select("votes")
      .eq("id", id)
      .single();

    const newVotes = (current?.votes ?? 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("ideas")
      .update({ votes: newVotes })
      .eq("id", id)
      .select("votes")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ voted: true, votes: updated?.votes ?? newVotes });
  }
}
