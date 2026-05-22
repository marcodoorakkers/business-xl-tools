import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function logUsage(userId: string, tool: string, creditsUsed: number) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("usage_logs")
    .insert({ user_id: userId, tool, credits_used: creditsUsed });
  if (error) console.error(`[usage_logs] insert failed for ${tool}:`, error.message);
}
