import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/app/gezin/dossier/components/BottomNav";
import AutoCheckoutWrapper from "./AutoCheckoutWrapper";
import SubscribeButton from "@/app/account/SubscribeButton";
import ManageSubscriptionButton from "@/app/account/ManageSubscriptionButton";
import ChangePasswordForm from "@/app/account/ChangePasswordForm";
import DeleteAccountButton from "@/app/account/DeleteAccountButton";
import TwoFactorSection from "./TwoFactorSection";
import ClearDataSection from "./ClearDataSection";


export default async function GezinAccountPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/gezin/inloggen");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_period_end, promo_code")
    .eq("id", user.id)
    .single();

  const subscriptionStatus = profile?.subscription_status ?? null;
  const subscriptionPeriodEnd = profile?.subscription_period_end ?? null;
  const isFoundingMember = profile?.promo_code === "founding25";
  const isVriend = profile?.promo_code === "vriendenvan";
  const params = await searchParams;
  const paymentStatus = params.payment;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  const formattedPeriodEnd = subscriptionPeriodEnd
    ? new Date(subscriptionPeriodEnd).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white md:pt-14">
      <main className="max-w-lg mx-auto px-6 py-8 pb-24 flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-gray-900">Account</h1>

        {/* Founding member badge */}
        {isFoundingMember && (
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Founding Member</p>
              <p className="text-xs text-amber-700 mt-0.5">Jij was er als een van de eerste 25. Bedankt voor je vertrouwen.</p>
            </div>
          </div>
        )}

        {/* Vriend van badge */}
        {isVriend && (
          <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Vriend van NooitMeerPostKwijt</p>
              <p className="text-xs text-blue-700 mt-0.5">Je geniet 6 maanden gratis toegang. Welkom!</p>
            </div>
          </div>
        )}

        {/* Auto checkout als promo in URL of localStorage — alleen als nog geen abonnement */}
        {!subscriptionStatus && <AutoCheckoutWrapper priceId={proPriceId} />}

        {/* Betaalfeedback */}
        {paymentStatus === "subscribed" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">
            {(isFoundingMember || isVriend)
              ? "Abonnement gestart! Je proefperiode van 6 maanden is actief."
              : "Abonnement gestart! Je eerste maand is gratis."}
          </div>
        )}
        {paymentStatus === "cancelled" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-700 text-sm font-medium">
            Betaling geannuleerd.
          </div>
        )}

        {/* Maandelijks abonnement */}
        {!subscriptionStatus && (
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span>⭐</span>
              <h2 className="font-bold text-gray-900 text-lg">Maandelijks abonnement</h2>
            </div>
            <p className="text-gray-500 text-sm mb-1">Onbeperkt scannen · opzegbaar wanneer je wil</p>
            <p className="text-amber-600 text-sm font-semibold mb-4">Eerste maand gratis — geen creditcard nodig</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">€3,99</span>
                <span className="text-gray-400 text-sm ml-1">/maand na proefperiode</span>
              </div>
              <SubscribeButton priceId={proPriceId} />
            </div>
          </div>
        )}

        {subscriptionStatus === "trialing" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-600 font-bold text-lg">✓</span>
              <h2 className="font-bold text-amber-800 text-lg">Proefperiode actief</h2>
            </div>
            <p className="text-amber-700 text-sm">{(isFoundingMember || isVriend)
              ? "Je zit in je gratis proefperiode van 6 maanden. Na de proefperiode gaat het abonnement automatisch over naar €3,99/maand — alleen als je een betaalmethode toevoegt."
              : "Je zit in je gratis proefmaand. Na de proefperiode gaat het abonnement automatisch over naar €3,99/maand — alleen als je een betaalmethode toevoegt."
            }</p>
            <ManageSubscriptionButton />
          </div>
        )}

        {subscriptionStatus === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <h2 className="font-bold text-green-800 text-lg">Maandelijks abonnement actief</h2>
            </div>
            <p className="text-green-700 text-sm">Je abonnement is actief. Onbeperkt scannen en archiveren.</p>
            {formattedPeriodEnd && (
              <p className="text-green-600 text-sm mt-1">Volgende verlenging: {formattedPeriodEnd}</p>
            )}
            <ManageSubscriptionButton />
          </div>
        )}

        {subscriptionStatus === "cancelling" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="font-bold text-amber-800 text-lg mb-1">
              Abonnement loopt af{formattedPeriodEnd ? ` op ${formattedPeriodEnd}` : ""}
            </h2>
            <p className="text-amber-700 text-sm">Je kunt de app nog gebruiken tot het einde van de betaalperiode.</p>
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">E-mailadres</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        <TwoFactorSection />

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Wachtwoord wijzigen</h2>
          <ChangePasswordForm />
        </div>

        {/* AVG gegevensexport */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Mijn gegevens downloaden</h2>
          <p className="text-sm text-gray-500 mb-4">Download een overzicht van alles wat we over jou opslaan. Je foto&apos;s en documenten staan niet in dit bestand — die bewaren we nooit op onze servers.</p>
          <a
            href="/api/gezin/my-data"
            download
            className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Gegevens downloaden
          </a>
        </div>

        <ClearDataSection />

        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-2">Account verwijderen</h2>
          <p className="text-sm text-gray-500 mb-4">Dit verwijdert je account en alle bijbehorende data permanent.</p>
          <DeleteAccountButton />
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 pb-2">
          <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacyverklaring</a>
          <span className="text-xs text-gray-300">·</span>
          <a href="/voorwaarden" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Algemene Voorwaarden</a>
          <span className="text-xs text-gray-300">·</span>
          <a href="/veiligheid" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Veiligheid &amp; Privacy FAQ</a>
          <span className="text-xs text-gray-300">·</span>
          <a href="/disclaimer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Disclaimer</a>
          <span className="text-xs text-gray-300">·</span>
          <a href="mailto:nooitmeerpostkwijt@business-xl.nl" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
        </div>
        <p className="text-center text-xs text-gray-300">© {new Date().getFullYear()} NooitMeerPostKwijt · Business XL</p>
      </main>
      <BottomNav />
    </div>
  );
}
