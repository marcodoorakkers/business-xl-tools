import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountButton from "./DeleteAccountButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar credits={credits} />
      <main className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>

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
