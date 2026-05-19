import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface DayPlan {
  day: string;
  dish: string;
  description: string;
  time: string;
}

interface WeekPlan {
  week: DayPlan[];
  shopping_list: Record<string, string[]>;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, plan }: { to: string; plan: WeekPlan } = await req.json();
  if (!to || !plan) return NextResponse.json({ error: "Ontbrekende gegevens" }, { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);

  const weekRows = plan.week.map((d) => `
    <tr>
      <td style="padding:10px 14px;font-weight:600;color:#1e293b;white-space:nowrap;border-bottom:1px solid #f1f5f9">${d.day}</td>
      <td style="padding:10px 14px;color:#1e293b;border-bottom:1px solid #f1f5f9">${d.dish}</td>
      <td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #f1f5f9">${d.description}</td>
      <td style="padding:10px 14px;color:#94a3b8;white-space:nowrap;border-bottom:1px solid #f1f5f9">⏱ ${d.time}</td>
    </tr>`).join("");

  const shoppingCategories = Object.entries(plan.shopping_list)
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
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Dag</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Gerecht</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Omschrijving</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Tijd</th>
          </tr>
        </thead>
        <tbody>${weekRows}</tbody>
      </table>
    </div>

    <div style="padding:0 28px 28px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">🛒 Boodschappenlijst</h2>
      <div style="background:#f8fafc;border-radius:12px;padding:20px">
        ${shoppingCategories}
      </div>
    </div>

    <div style="padding:20px 28px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Gegenereerd via <strong>Business XL Tools</strong> · business-xl.nl</p>
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: "Business XL Tools <startwithadraft@business-xl.nl>",
    to,
    subject: "🍽️ Jouw weekmenu",
    html,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
