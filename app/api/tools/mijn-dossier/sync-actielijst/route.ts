import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken, uploadFileToOneDrive } from "@/lib/onedrive";
import { getValidDropboxToken, forceRefreshDropboxToken, uploadFileToDropbox } from "@/lib/dropbox";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface DocumentAction {
  id: string;
  actie: string;
  deadline: string | null;
  afzender: string | null;
  document_naam: string | null;
}

function buildMarkdown(actions: DocumentAction[]): string {
  const now = Date.now();
  const overdue: DocumentAction[] = [];
  const thisWeek: DocumentAction[] = [];
  const later: DocumentAction[] = [];
  const noDeadline: DocumentAction[] = [];

  for (const a of actions) {
    if (!a.deadline) {
      noDeadline.push(a);
      continue;
    }
    const days = Math.ceil((new Date(a.deadline).getTime() - now) / 86400000);
    if (days < 0) overdue.push(a);
    else if (days <= 7) thisWeek.push(a);
    else later.push(a);
  }

  const datumStr = new Date().toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const lines: string[] = [
    "# Actielijst",
    "",
    `_Bijgewerkt op ${datumStr}_`,
    "",
  ];

  function formatItem(a: DocumentAction): string {
    const parts: string[] = [`- [ ] ${a.actie}`];
    const meta: string[] = [];
    if (a.deadline) {
      const d = new Date(a.deadline).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      meta.push(`deadline: ${d}`);
    }
    if (a.afzender) meta.push(`van: ${a.afzender}`);
    if (meta.length) parts.push(`  _(${meta.join(" · ")})_`);
    return parts.join("\n");
  }

  if (overdue.length) {
    lines.push("## ⚠️ Te laat", "");
    overdue.forEach(a => lines.push(formatItem(a), ""));
  }
  if (thisWeek.length) {
    lines.push("## 📅 Deze week", "");
    thisWeek.forEach(a => lines.push(formatItem(a), ""));
  }
  if (later.length) {
    lines.push("## 📋 Later", "");
    later.forEach(a => lines.push(formatItem(a), ""));
  }
  if (noDeadline.length) {
    lines.push("## Geen deadline", "");
    noDeadline.forEach(a => lines.push(formatItem(a), ""));
  }

  if (actions.length === 0) {
    lines.push("_Geen openstaande acties._", "");
  }

  lines.push("---", "_Gegenereerd door NooitMeerPostKwijt_");
  return lines.join("\n");
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: actions } = await supabase
    .from("document_actions")
    .select("id, actie, deadline, afzender, document_naam")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("deadline", { ascending: true, nullsFirst: false });

  const markdown = buildMarkdown((actions ?? []) as DocumentAction[]);
  const buffer = Buffer.from(markdown, "utf-8");

  const admin = createAdminClient();
  const results = { onedrive: false, dropbox: false };

  // OneDrive
  const onedriveToken = await getValidAccessToken(user.id);
  if (onedriveToken) {
    const { data: tokenRow } = await admin
      .from("onedrive_tokens")
      .select("archive_root")
      .eq("user_id", user.id)
      .single();
    const archiveRoot = tokenRow?.archive_root ?? "Archief";
    try {
      await uploadFileToOneDrive(onedriveToken, `${archiveRoot}/Actielijst.md`, buffer, "text/markdown");
      results.onedrive = true;
    } catch {
      // non-fatal: log but continue
    }
  }

  // Dropbox
  let dropboxToken = await getValidDropboxToken(user.id);
  if (dropboxToken) {
    const { data: tokenRow } = await admin
      .from("dropbox_tokens")
      .select("archive_root")
      .eq("user_id", user.id)
      .single();
    const archiveRoot = tokenRow?.archive_root ?? "Archief";
    try {
      await uploadFileToDropbox(dropboxToken, `${archiveRoot}/Actielijst.md`, buffer, "text/markdown");
      results.dropbox = true;
    } catch (err) {
      if ((err as Error & { status?: number }).status === 401) {
        const refreshed = await forceRefreshDropboxToken(user.id);
        if (refreshed) {
          dropboxToken = refreshed;
          try {
            await uploadFileToDropbox(dropboxToken, `${archiveRoot}/Actielijst.md`, buffer, "text/markdown");
            results.dropbox = true;
          } catch {
            // still failed after refresh
          }
        }
      }
    }
  }

  return NextResponse.json({ ...results, total: actions?.length ?? 0 });
}
