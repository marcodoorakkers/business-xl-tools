import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface DayPlan {
  day: string;
  dish: string;
  description: string;
  time: string;
  recipe: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, activeDays, shopping_list }: {
    to: string;
    activeDays: DayPlan[];
    shopping_list: Record<string, string[]>;
  } = await req.json();

  if (!to || !activeDays || !shopping_list) return NextResponse.json({ error: "Ontbrekende gegevens" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);

  const weekRows = activeDays.map((d) => `
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#1e293b;white-space:nowrap;border-bottom:1px solid #f1f5f9;vertical-align:top">${d.day}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <strong style="color:#1e293b">${d.dish}</strong>
        <br><span style="color:#64748b;font-size:13px">${d.description}</span>
        <br><span style="color:#94a3b8;font-size:12px">⏱ ${d.time}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:0"></td>
      <td style="padding:4px 14px 12px;border-bottom:1px solid #f1f5f9">
        <details style="cursor:pointer">
          <summary style="font-size:12px;color:#3b82f6;font-weight:500">Recept bekijken</summary>
          <p style="margin:6px 0 0;font-size:13px;color:#475569;white-space:pre-line;line-height:1.6">${d.recipe}</p>
        </details>
      </td>
    </tr>`).join("");

  const shoppingCategories = Object.entries(shopping_list)
    .filter(([, items]) => items.length > 0)
    .map(([cat, items]) => `
      <div style="margin-bottom:16px">
        <p style="margin:0 0 6px;font-weight:600;color:#1e293b;font-size:14px">${cat}</p>
        <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px">
          ${items.map((i) => `<li style="margin-bottom:3px">${i}</li>`).join("")}
        </ul>
      </div>`).join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px">
      <p style="margin:0;font-size:28px">🍽️</p>
      <h1 style="margin:8px 0 4px;color:#fff;font-size:22px;font-weight:700">Jouw weekmenu</h1>
      <p style="margin:0;color:#bfdbfe;font-size:14px">Gegenereerd door Business XL Tools</p>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">📅 Weekoverzicht</h2>
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #f1f5f9">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;width:110px">Dag</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Gerecht</th>
          </tr>
        </thead>
        <tbody>${weekRows}</tbody>
      </table>
    </div>
    <div style="padding:0 28px 28px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">🛒 Boodschappenlijst</h2>
      <div style="background:#f8fafc;border-radius:12px;padding:20px">${shoppingCategories}</div>
    </div>
    <div style="padding:20px 28px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Gegenereerd via <strong>TimeSaverTools</strong> · timesavertools.nl</p>
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: "TimeSaverTools <noreply@timesavertools.nl>",
    to,
    subject: "🍽️ Jouw weekmenu",
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
