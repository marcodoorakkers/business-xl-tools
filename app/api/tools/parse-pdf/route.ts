import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
// Use lib path (v1.x) to avoid pdf-parse loading test fixtures at module level
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require("pdf-parse/lib/pdf-parse.js");

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("pdf") as File;
  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
  if (!file.type.includes("pdf")) return NextResponse.json({ error: "Alleen PDF bestanden zijn toegestaan" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "PDF mag maximaal 5MB zijn" }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const text = parsed.text.trim();
    if (!text) return NextResponse.json({ error: "Kon geen tekst uit de PDF halen. Probeer een ander bestand." }, { status: 400 });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "PDF kon niet worden verwerkt" }, { status: 500 });
  }
}
