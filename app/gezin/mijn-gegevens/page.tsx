import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

function esc(str: string | null | undefined) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

const statusLabel: Record<string, string> = {
  trialing: "Proefperiode",
  active: "Actief",
  cancelling: "Loopt af",
};

export default async function MijnGegevensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/gezin/inloggen");

  const [profile, documents, actions, settings, members] = await Promise.all([
    supabase.from("profiles").select("subscription_status, subscription_period_end, promo_code, created_at").eq("id", user.id).single(),
    supabase.from("documents").select("afzender, type, datum, onderwerp, mappad, bestandsnaam, gezinslid, samenvatting, storage, actie, actie_gedaan, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("document_actions").select("actie, actie_type, deadline, status, afzender, document_naam, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("archive_settings").select("storage_preference, folder_structure").eq("user_id", user.id).single(),
    supabase.from("archive_family_members").select("name, full_name").eq("user_id", user.id),
  ]);

  const p = profile.data ?? {};
  const s = settings.data ?? {};
  const docs = documents.data ?? [];
  const acts = actions.data ?? [];
  const mems = members.data ?? [];

  const exportDate = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  type DocRow = { afzender?: string; type?: string; datum?: string; onderwerp?: string; mappad?: string; bestandsnaam?: string; gezinslid?: string; samenvatting?: string; storage?: string; actie?: string; actie_gedaan?: boolean; created_at?: string };
  type ActRow = { actie?: string; actie_type?: string; deadline?: string; status?: string; afzender?: string; document_naam?: string; created_at?: string };
  type MemRow = { name?: string; full_name?: string };

  function Row({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
      <tr>
        <td className="py-1 pr-4 text-xs text-gray-400 font-medium whitespace-nowrap align-top w-40">{label}</td>
        <td className="py-1 text-xs text-gray-800 align-top">{value}</td>
      </tr>
    );
  }

  const folderLabel = (s as Record<string, string>).folder_structure === "by_person"
    ? "Per geadresseerde"
    : (s as Record<string, string>).folder_structure === "by_subject"
    ? "Per onderwerp"
    : (s as Record<string, string>).folder_structure ?? "—";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Print / back bar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <a href="/gezin/account" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Terug
        </a>
        <PrintButton />
      </div>

      {/* Amber header */}
      <div className="bg-amber-500 px-8 py-7 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gezin-apple-touch-icon.png" alt="NooitMeerPostKwijt" className="w-12 h-12 rounded-xl" />
        <div>
          <h1 className="text-xl font-extrabold text-white">Mijn gegevens</h1>
          <p className="text-xs text-amber-100">NooitMeerPostKwijt · Gegenereerd op {exportDate}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 pb-16">
        {/* Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-xs text-yellow-900 leading-relaxed">
          Dit is een volledig overzicht van alle gegevens die NooitMeerPostKwijt over jou opslaat.
          Foto&apos;s en documenten worden <strong>nooit opgeslagen</strong> op onze servers — alleen de AI-analyse (afzender, type, samenvatting) staat hieronder.
          Je bestanden staan uitsluitend in jouw eigen OneDrive of Dropbox.
        </div>

        {/* Account */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-yellow-200 pb-1 mb-3">Account</h2>
        <table className="w-full mb-6">
          <tbody>
            <Row label="E-mailadres" value={user.email} />
            <Row label="Aangemeld op" value={fmt((p as Record<string, string>).created_at)} />
            <Row label="Abonnementsstatus" value={statusLabel[(p as Record<string, string>).subscription_status] ?? (p as Record<string, string>).subscription_status ?? "—"} />
            <Row label="Abonnement loopt tot" value={fmt((p as Record<string, string>).subscription_period_end)} />
            <Row label="Promo code" value={(p as Record<string, string>).promo_code} />
          </tbody>
        </table>

        {/* Instellingen */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-yellow-200 pb-1 mb-3">Instellingen</h2>
        <table className="w-full mb-6">
          <tbody>
            <Row label="Opslaglocatie" value={(s as Record<string, string>).storage_preference} />
            <Row label="Mapstructuur" value={folderLabel} />
          </tbody>
        </table>

        {/* Geadresseerden */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-yellow-200 pb-1 mb-3">Geadresseerden ({mems.length})</h2>
        {mems.length === 0
          ? <p className="text-xs text-gray-400 italic mb-6">Geen geadresseerden toegevoegd.</p>
          : <div className="flex flex-col gap-2 mb-6">
              {(mems as MemRow[]).map((m, i) => (
                <div key={i} className="border border-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm font-semibold text-gray-900">{esc(m.name)}</p>
                  {m.full_name && <p className="text-xs text-gray-500">{esc(m.full_name)}</p>}
                </div>
              ))}
            </div>
        }

        {/* Documenten */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-yellow-200 pb-1 mb-3">Documenten ({docs.length})</h2>
        {docs.length === 0
          ? <p className="text-xs text-gray-400 italic mb-6">Nog geen documenten gescand.</p>
          : <div className="flex flex-col gap-2 mb-6">
              {(docs as DocRow[]).map((d, i) => (
                <div key={i} className="border border-gray-100 rounded-lg px-4 py-3 break-inside-avoid">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {esc(d.afzender ?? "Onbekend")}{d.onderwerp ? ` — ${esc(d.onderwerp)}` : ""}
                  </p>
                  <table className="w-full">
                    <tbody>
                      <Row label="Datum document" value={fmt(d.datum)} />
                      <Row label="Type" value={d.type} />
                      <Row label="Mappad" value={d.mappad} />
                      <Row label="Bestandsnaam" value={d.bestandsnaam} />
                      <Row label="Geadresseerde" value={d.gezinslid} />
                      <Row label="Samenvatting" value={d.samenvatting} />
                      <Row label="Opgeslagen in" value={d.storage} />
                      <Row label="Actie" value={d.actie} />
                      <Row label="Gescand op" value={fmt(d.created_at)} />
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
        }

        {/* Acties */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-yellow-200 pb-1 mb-3">Acties ({acts.length})</h2>
        {acts.length === 0
          ? <p className="text-xs text-gray-400 italic mb-6">Geen acties.</p>
          : <div className="flex flex-col gap-2 mb-6">
              {(acts as ActRow[]).map((a, i) => (
                <div key={i} className="border border-gray-100 rounded-lg px-4 py-3 break-inside-avoid">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      a.status === "gedaan" ? "bg-green-100 text-green-800"
                      : a.status === "overgeslagen" ? "bg-gray-100 text-gray-600"
                      : "bg-amber-100 text-amber-800"
                    }`}>{a.status ?? "open"}</span>
                    <p className="text-sm font-semibold text-gray-900">{esc(a.actie)}</p>
                  </div>
                  <table className="w-full">
                    <tbody>
                      <Row label="Afzender" value={a.afzender} />
                      <Row label="Document" value={a.document_naam} />
                      <Row label="Type" value={a.actie_type} />
                      <Row label="Deadline" value={fmt(a.deadline)} />
                      <Row label="Aangemaakt op" value={fmt(a.created_at)} />
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
        }

        <p className="text-center text-xs text-gray-300 mt-8">
          NooitMeerPostKwijt · nooitmeerpostkwijt.nl · © {new Date().getFullYear()} Business XL
        </p>
      </div>
    </>
  );
}
