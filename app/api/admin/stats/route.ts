import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  // Total users
  const { count: totalUsers } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // All usage logs for aggregation
  const { data: allLogs } = await admin
    .from("usage_logs")
    .select("tool, credits_used, created_at");

  const logs = allLogs ?? [];

  const spentLogs = logs.filter((l) => l.credits_used > 0);
  const soldLogs = logs.filter((l) => l.credits_used < 0);

  const totalUsage = spentLogs.length;
  const creditsSpent = spentLogs.reduce((sum, l) => sum + l.credits_used, 0);
  const creditsSold = soldLogs.reduce((sum, l) => sum + Math.abs(l.credits_used), 0);

  // byTool — group by tool (spent only)
  const toolMap: Record<string, { count: number; credits: number }> = {};
  for (const l of spentLogs) {
    if (!toolMap[l.tool]) toolMap[l.tool] = { count: 0, credits: 0 };
    toolMap[l.tool].count += 1;
    toolMap[l.tool].credits += l.credits_used;
  }
  const byTool = Object.entries(toolMap)
    .map(([tool, v]) => ({ tool, count: v.count, credits: v.credits }))
    .sort((a, b) => b.count - a.count);

  // byDay — last 30 days (spent only)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dayMap: Record<string, number> = {};
  for (const l of spentLogs) {
    const d = new Date(l.created_at);
    if (d >= thirtyDaysAgo) {
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayMap[key] = (dayMap[key] || 0) + 1;
    }
  }

  // Fill all 30 days
  const byDay: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: dayMap[key] || 0 });
  }

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    totalUsage,
    creditsSpent,
    creditsSold,
    byTool,
    byDay,
  });
}
