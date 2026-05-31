import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NMMPKLogo from "@/components/NMMPKLogo";
import BuyCreditsButton from "@/app/account/BuyCreditsButton";
import SubscribeButton from "@/app/account/SubscribeButton";
import CancelSubscriptionButton from "@/app/account/CancelSubscriptionButton";
import ManageSubscriptionButton from "@/app/account/ManageSubscriptionButton";
import ChangePasswordForm from "@/app/account/ChangePasswordForm";
import DeleteAccountButton from "@/app/account/DeleteAccountButton";

const PACKAGES = [
  { name: "10 scans",  credits: 10,  price: "€1,99",  priceId: process.env.STRIPE_PRICE_10!,  perScan: "€0,20/scan" },
  { name: "50 scans",  credits: 50,  price: "€7,49",  priceId: process.env.STRIPE_PRICE_50!,  perScan: "€0,15/scan" },
  { name: "100 scans", credits: 100, price: "€11,99", priceId: process.env.STRIPE_PRICE_100!, perScan: "€0,12/scan" },
  { name: "200 scans", credits: 200, price: "€19,99", priceId: process.env.STRIPE_PRICE_200!, perScan: "€0,10/scan" },
];

export default async function GezinAccountPage({ searchParams }: { searchParams: Promise<{ payment?: string; credits?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/gezin/inloggen");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, subscription_credits, subscription_status, subscription_period_end")
    .eq("id", user.id)
    .single();

  const purchasedCredits = profile?.credits ?? 0;
  const subscriptionCredits = profile?.subscription_credits ?? 0;
  const credits = purchasedCredits + subscriptionCredits;
  const subscriptionStatus = profile?.subscription_status ?? null;
  const subscriptionPeriodEnd = profile?.subscription_period_end ?? null;
  const params = await searchParams;
  const paymentStatus = params.payment;
  const addedCredits = params.credits;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  const formattedPeriodEnd = subscriptionPeriodEnd
    ? new Date(subscriptionPeriodEnd).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <NMMPKLogo iconOnly />
          <Link href="/dossier" className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
            ← Terug
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-gray-900">Account</h1>

        {/* Betaalfeedback */}
        {paymentStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">
            🎉 Betaling geslaagd! {addedCredits} scans zijn toegevoegd aan je account.
          </div>
        )}
        {paymentStatus === "subscribed" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">
            🎉 Abonnement gestart! 50 scans zijn toegevoegd.
          </div>
        )}
        {paymentStatus === "cancelled" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-700 text-sm font-medium">
            Betaling geannuleerd. Je scans zijn niet gewijzigd.
          </div>
        )}

        {/* Scans saldo */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
          <p className="text-amber-100 text-sm mb-1">Jouw scans</p>
          <p className="text-5xl font-extrabold">{credits}</p>
          {subscriptionStatus === "active" && subscriptionCredits > 0 ? (
            <p className="text-amber-100 text-sm mt-1">{subscriptionCredits} abonnement (deze maand) · {purchasedCredits} gekocht (verlopen nooit)</p>
          ) : (
            <p className="text-amber-100 text-sm mt-1">scans beschikbaar · verlopen nooit</p>
          )}
        </div>

        {/* Maandelijks abonnement */}
        {!subscriptionStatus && (
          <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span>⭐</span>
              <h2 className="font-bold text-gray-900 text-lg">Maandelijks abonnement</h2>
            </div>
            <p className="text-gray-500 text-sm mb-1">50 scans per maand · opzegbaar wanneer je wil</p>
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
            <p className="text-amber-700 text-sm">Je zit in je gratis proefmaand. Je hebt 50 scans beschikbaar. Na de proefperiode gaat het abonnement automatisch over naar €3,99/maand — alleen als je een betaalmethode toevoegt.</p>
            <ManageSubscriptionButton />
          </div>
        )}

        {subscriptionStatus === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <h2 className="font-bold text-green-800 text-lg">Maandelijks abonnement actief</h2>
            </div>
            <p className="text-green-700 text-sm">Je ontvangt elke maand 50 verse scans. Ongebruikte abonnementsscans vervallen aan het einde van de maand.</p>
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
            <p className="text-amber-700 text-sm">Je abonnementsscans zijn nog geldig tot het einde van de betaalperiode. Daarna blijven je gekochte scans gewoon staan.</p>
          </div>
        )}

        {/* Scans kopen */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Scans kopen</h2>
          <p className="text-sm text-gray-500 mb-5">Kies een pakket — scans verlopen nooit.</p>
          <div className="flex flex-col gap-3">
            {PACKAGES.map((pkg) => (
              <div key={pkg.priceId} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-amber-50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">{pkg.name}</p>
                  <p className="text-xs text-gray-400">{pkg.perScan}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-sm">{pkg.price}</span>
                  <BuyCreditsButton priceId={pkg.priceId} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Betalen via iDEAL, creditcard of Bancontact</p>
        </div>

        {/* Cross-promo TimeSaverTools */}
        <a
          href="https://timesavertools.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 hover:border-blue-400 hover:shadow-sm transition-all group"
        >
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Ook ZZP-er of ondernemer?</p>
            <p className="text-xs text-gray-500">Ontdek onze zakelijke tools op TimeSaverTools.nl — je scans werken er ook.</p>
          </div>
          <span className="text-blue-400 group-hover:text-blue-600 transition-colors text-sm">→</span>
        </a>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">E-mailadres</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Wachtwoord wijzigen</h2>
          <ChangePasswordForm />
        </div>

        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-2">Account verwijderen</h2>
          <p className="text-sm text-gray-500 mb-4">Dit verwijdert je account en alle bijbehorende data permanent.</p>
          <DeleteAccountButton />
        </div>
      </main>
    </div>
  );
}
