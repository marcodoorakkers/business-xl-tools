import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) return NextResponse.json({ error: "Ontbrekende velden" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Voice Mail Draft <startwithadraft@business-xl.nl>",
    to,
    subject: `[CONCEPT] ${subject}`,
    text: body,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
