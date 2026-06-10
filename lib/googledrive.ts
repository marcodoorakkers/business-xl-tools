import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "@/lib/token-encryption";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export async function getValidGoogleDriveToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("google_drive_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!row) return null;

  const accessToken = decryptToken(row.access_token);
  const refreshTokenValue = decryptToken(row.refresh_token);

  const expiresAt = new Date(row.expires_at).getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() < expiresAt - fiveMinutes) {
    return accessToken;
  }

  return doRefreshToken(userId, refreshTokenValue);
}

export async function forceRefreshGoogleDriveToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("google_drive_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .single();

  if (!row) return null;
  return doRefreshToken(userId, decryptToken(row.refresh_token));
}

async function doRefreshToken(userId: string, refreshTokenValue: string): Promise<string | null> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshTokenValue,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from("google_drive_tokens").update({
    access_token: encryptToken(tokens.access_token),
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return tokens.access_token;
}

async function getOrCreateFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
  const parentClause = parentId ? `'${parentId}' in parents` : `'root' in parents`;
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and ${parentClause} and trashed=false`;

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files?.length > 0) return data.files[0].id as string;
  }

  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errBody = await createRes.text().catch(() => "");
    const err = new Error(`Google Drive map aanmaken mislukt: ${createRes.status} ${errBody.slice(0, 200)}`);
    (err as Error & { status?: number }).status = createRes.status;
    throw err;
  }

  const folder = await createRes.json();
  return folder.id as string;
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  folderPath: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ webUrl: string }> {
  const parts = folderPath.split("/").filter(Boolean);
  let parentId: string | undefined;

  for (const part of parts) {
    parentId = await getOrCreateFolder(accessToken, part, parentId);
  }

  const boundary = "nmmpk_" + Date.now();
  const metadata = JSON.stringify({
    name: filename,
    ...(parentId ? { parents: [parentId] } : {}),
  });

  const headerBuf = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const footerBuf = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([headerBuf, buffer, footerBuf]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: body as unknown as BodyInit,
    }
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text().catch(() => "");
    const err = new Error(`Google Drive upload mislukt: ${uploadRes.status} ${errBody.slice(0, 200)}`);
    (err as Error & { status?: number }).status = uploadRes.status;
    throw err;
  }

  const fileData = await uploadRes.json();
  return { webUrl: fileData.webViewLink ?? "" };
}
