import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId vereist" }, { status: 400 });

  const admin = createAdminClient();

  const [profile, documents, actions, settings, members] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).single(),
    admin.from("documents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("document_actions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("archive_settings").select("*").eq("user_id", userId).single(),
    admin.from("archive_family_members").select("*").eq("user_id", userId),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    user_id: userId,
    profiel: profile.data ?? null,
    instellingen: settings.data ?? null,
    geadresseerden: members.data ?? [],
    documenten: documents.data ?? [],
    acties: actions.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nmpk-gegevens-${userId.slice(0, 8)}.json"`,
    },
  });
}
