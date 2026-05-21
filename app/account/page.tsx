import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountButton from "./DeleteAccountButton";
import BuyCreditsButton from "./BuyCreditsButton";
import SubscribeButton from "./SubscribeButton";
import CancelSubscriptionButton from "./CancelSubscriptionButton";

const PACKAGES = [
  { name: "Starter", credits: 50, price: "€9,99", priceId: "price_1TZSta1ifGSUEPSdHvDnulnr", perCredit: "€0,20/credit" },
  { name: "Populair", credits: 200, price: "€29,99", priceId: "price_1TZSte1ifGSUEPSd9N8emyuz", perCredit: "€0,15/credit" },
  { name: "Beste Koop", credits: 500, price: "€59,99", priceId: "price_1TZStd1ifGSUEPSdlWmrtbOS", perCredit: "€0,12/credit" },
];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ payment?: string; credits?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, subscription_status, subscription_period_end")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits ?? 0;
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
    <div className="min-h-screen bg-gray-50">
      <Navbar credits={credits} />
      <main className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>

        {/* Payment feedback */}
        {paymentStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">
            🎉 Betaling geslaagd! {addedCredits} credits zijn toegevoegd aan je account.
          </div>
        )}
        {paymentStatus === "subscribed" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-medium">
            🎉 Welkom bij Pro! 50 credits zijn toegevoegd.
          </div>
        )}
        {paymentStatus === "cancelled" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-700 text-sm font-medium">
            Betaling geannuleerd. Je credits zijn niet gewijzigd.
          </div>
        )}

        {/* Credits balance */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-sm mb-1">Jouw credits</p>
          <p className="text-5xl font-extrabold">{credits}</p>
          <p className="text-blue-200 text-sm mt-1">credits beschikbaar</p>
        </div>

        {/* Pro subscription section */}
        {!subscriptionStatus && (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⭐</span>
              <h2 className="font-bold text-lg">Pro abonnement</h2>
            </div>
            <p className="text-amber-100 text-sm mb-4">
              50 credits per maand · automatisch verlengd · opzegbaar wanneer je wil
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-extrabold">€4,99</span>
                <span className="text-amber-100 text-sm ml-1">/maand</span>
              </div>
              <SubscribeButton priceId={proPriceId} />
            </div>
          </div>
        )}

        {subscriptionStatus === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 font-bold text-lg">✓</span>
              <h2 className="font-bold text-green-800 text-lg">Pro abonnement actief</h2>
            </div>
            <p className="text-green-700 text-sm">Je ontvangt elke maand 50 nieuwe credits.</p>
            {formattedPeriodEnd && (
              <p className="text-green-600 text-sm mt-1">Volgende verlenging: {formattedPeriodEnd}</p>
            )}
            <CancelSubscriptionButton periodEnd={subscriptionPeriodEnd} />
          </div>
        )}

        {subscriptionStatus === "cancelling" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="font-bold text-amber-800 text-lg mb-1">
              Abonnement loopt af{formattedPeriodEnd ? ` op ${formattedPeriodEnd}` : ""}
            </h2>
            <p className="text-amber-700 text-sm">Je credits blijven gewoon staan.</p>
          </div>
        )}

        {/* Buy credits */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Credits kopen</h2>
          <p className="text-sm text-gray-500 mb-5">Kies een pakket — credits vervallen nooit.</p>
          <div className="flex flex-col gap-3">
            {PACKAGES.map((pkg) => (
              <div key={pkg.priceId} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{pkg.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{pkg.credits} credits · {pkg.perCredit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{pkg.price}</span>
                  <BuyCreditsButton priceId={pkg.priceId} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Betalen via iDEAL, creditcard of Bancontact · Excl. BTW</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">E-mailadres</h2>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Wachtwoord wijzigen</h2>
          <ChangePasswordForm />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-2">Account verwijderen</h2>
          <p className="text-sm text-gray-500 mb-4">Dit verwijdert je account en alle bijbehorende data permanent.</p>
          <DeleteAccountButton />
        </div>
      </main>
    </div>
  );
}
