import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "@/lib/token-encryption";

const TOKEN_ENDPOINT = "https://api.dropbox.com/oauth2/token";

export async function getValidDropboxToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("dropbox_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!row) return null;

  const accessToken = decryptToken(row.access_token);
  const refreshToken = decryptToken(row.refresh_token);

  const expiresAt = new Date(row.expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() < expiresAt - fiveMinutes) {
    return accessToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    client_secret: process.env.DROPBOX_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000).toISOString();

  await admin.from("dropbox_tokens").update({
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token ?? refreshToken),
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return tokens.access_token;
}

export async function forceRefreshDropboxToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("dropbox_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();

  if (!row) return null;

  const refreshToken = decryptToken(row.refresh_token);

  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    client_secret: process.env.DROPBOX_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 14400) * 1000).toISOString();

  await admin.from("dropbox_tokens").update({
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token ?? refreshToken),
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return tokens.access_token;
}

export async function checkDropboxFolderExists(accessToken: string, fullPath: string): Promise<boolean> {
  const res = await fetch("https://api.dropboxapi.com/2/files/get_metadata", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: "/" + fullPath }),
  });
  if (res.status === 409) return false;
  return res.ok;
}

export async function uploadFileToDropbox(
  accessToken: string,
  fullPath: string,
  buffer: Buffer,
  _mimeType: string
): Promise<{ webUrl: string }> {
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path: "/" + fullPath, mode: "add", autorename: true }),
      "Content-Type": "application/octet-stream",
    },
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Dropbox upload failed: ${res.status} ${body.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const uploadData = await res.json();
  const uploadedPath = uploadData.path_display ?? ("/" + fullPath);

  const linkRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: uploadedPath }),
  });

  if (linkRes.ok) {
    const linkData = await linkRes.json();
    return { webUrl: linkData.url ?? "" };
  }

  if (linkRes.status === 409) {
    const listRes = await fetch("https://api.dropboxapi.com/2/sharing/list_shared_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: uploadedPath, direct_only: true }),
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const url = listData.links?.[0]?.url ?? "";
      return { webUrl: url };
    }
  }

  return { webUrl: "" };
}
