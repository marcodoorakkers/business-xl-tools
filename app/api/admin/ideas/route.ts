import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ideas, error } = await admin
    .from("ideas")
    .select("id, title, description, status, votes, created_at, user_id")
    .order("votes", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ideas: ideas ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  const validStatuses = ["nieuw", "overweging", "ontwikkeling", "live"];
  if (!id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch current idea to check if we need to award credits
  const { data: idea, error: fetchError } = await admin
    .from("ideas")
    .select("status, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !idea) return NextResponse.json({ error: "Idee niet gevonden" }, { status: 404 });

  // Update the status
  const { error } = await admin.from("ideas").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award 100 credits if this idea just went live for the first time
  let creditsAwarded = false;
  if (status === "live" && idea.status !== "live") {
    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", idea.user_id)
      .single();

    if (profile) {
      await admin
        .from("profiles")
        .update({ credits: profile.credits + 100 })
        .eq("id", idea.user_id);
      creditsAwarded = true;
    }
  }

  return NextResponse.json({ success: true, status, creditsAwarded });
}
