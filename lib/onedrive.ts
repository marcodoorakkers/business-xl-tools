import { createAdminClient } from "@/lib/supabase/admin";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("onedrive_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() < expiresAt - fiveMinutes) {
    return row.access_token;
  }

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin.from("onedrive_tokens").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? row.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return tokens.access_token;
}

function buildGraphPath(fullPath: string): string {
  const segments = fullPath.split("/").filter(Boolean).map(encodeURIComponent);
  return segments.join("/");
}

export async function checkFolderExists(accessToken: string, fullPath: string): Promise<boolean> {
  const encodedPath = buildGraphPath(fullPath);
  const res = await fetch(`${GRAPH_BASE}/me/drive/special/approot:/${encodedPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.status === 200;
}

export async function uploadFileToOneDrive(
  accessToken: string,
  fullPath: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ webUrl: string }> {
  const encodedPath = buildGraphPath(fullPath);
  const res = await fetch(`${GRAPH_BASE}/me/drive/special/approot:/${encodedPath}:/content`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OneDrive upload failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return { webUrl: data.webUrl };
}
