"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  created_at: string;
  credits: number;
  total_usage: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "set">("add");
  const [saving, setSaving] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.status === 401) { setError("Geen toegang."); setLoading(false); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function saveCredits(userId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: Number(amount), mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`Fout: ${data.error || res.status}`);
      } else if (data.success) {
        setUsers(users.map((u) => u.id === userId ? { ...u, credits: data.newCredits } : u));
        setSuccessId(userId);
        setTimeout(() => setSuccessId(null), 2000);
        setEditId(null);
        setAmount("");
        setError("");
      }
    } catch (e) {
      setError("Netwerkfout bij opslaan.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">⚙️ Admin</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gebruikersbeheer</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Aangemeld</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Credits</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Gebruik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {successId === user.id ? (
                        <span className="text-green-600 font-semibold">✓ {user.credits}</span>
                      ) : (
                        <span className={`font-semibold ${user.credits === 0 ? "text-red-500" : "text-blue-600"}`}>
                          {user.credits}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{user.total_usage}x</td>
                    <td className="px-4 py-3 text-right">
                      {editId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as "add" | "set")}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                          >
                            <option value="add">Toevoegen</option>
                            <option value="set">Instellen op</option>
                          </select>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveCredits(user.id)}
                            disabled={saving || !amount}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-3 py-1 text-xs font-medium"
                          >
                            {saving ? "..." : "Opslaan"}
                          </button>
                          <button
                            onClick={() => { setEditId(null); setAmount(""); }}
                            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                          >
                            Annuleer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditId(user.id); setAmount(""); setMode("add"); }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Credits aanpassen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Nog geen gebruikers.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
