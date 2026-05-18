import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < 1) {
    return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File;
  if (!audio) return NextResponse.json({ error: "Geen audio" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
  });

  return NextResponse.json({ text: transcription.text });
}
