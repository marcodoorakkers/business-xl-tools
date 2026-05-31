import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface FileMeta {
  path: string;
  name: string;
  type: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(req.url);
  const isFamilySite =
    url.hostname === "nooitmeerpostkwijt.nl" ||
    url.hostname === "www.nooitmeerpostkwijt.nl";
  const base = isFamilySite ? "" : "/gezin";

  if (!user) {
    return NextResponse.redirect(new URL(`${base}/inloggen`, req.url));
  }

  const formData = await req.formData();
  const rawFiles = formData.getAll("files").filter((f) => f instanceof File) as File[];

  if (rawFiles.length === 0) {
    return NextResponse.redirect(new URL(`${base}/dossier`, req.url));
  }

  const admin = createAdminClient();
  await admin.storage.createBucket("share-temp", { public: false, fileSizeLimit: 20 * 1024 * 1024 }).catch(() => {});

  const shareKey = crypto.randomUUID();
  const filesMeta: FileMeta[] = [];

  for (let i = 0; i < rawFiles.length; i++) {
    const file = rawFiles[i];
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${shareKey}/${i}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from("share-temp").upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
    if (!error) {
      filesMeta.push({ path, name: file.name, type: file.type });
    }
  }

  if (filesMeta.length === 0) {
    return NextResponse.redirect(new URL(`${base}/dossier`, req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("pending_share", JSON.stringify({ files: filesMeta }), {
    maxAge: 300,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.redirect(new URL(`${base}/dossier?from_share=1`, req.url));
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const pending = cookieStore.get("pending_share");
  if (!pending) return NextResponse.json({ error: "No pending share" }, { status: 404 });

  let filesMeta: FileMeta[];
  try {
    ({ files: filesMeta } = JSON.parse(pending.value));
  } catch {
    return NextResponse.json({ error: "Invalid cookie" }, { status: 400 });
  }

  cookieStore.delete("pending_share");

  const admin = createAdminClient();

  const results = await Promise.all(
    filesMeta.map(async (meta) => {
      const { data, error } = await admin.storage.from("share-temp").download(meta.path);
      await admin.storage.from("share-temp").remove([meta.path]).catch(() => {});
      if (error || !data) return null;
      const buffer = Buffer.from(await data.arrayBuffer());
      return { name: meta.name, type: meta.type, data: buffer.toString("base64") };
    })
  );

  const files = results.filter(Boolean);
  if (files.length === 0) return NextResponse.json({ error: "Files not found" }, { status: 404 });

  return NextResponse.json({ files });
}
