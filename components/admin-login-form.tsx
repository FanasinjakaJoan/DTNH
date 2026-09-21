"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Mot de passe incorrect.");
      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold">Mot de passe</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-lg outline-none transition focus:border-court" autoComplete="current-password" required />
      </label>
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className="mt-6 min-h-14 w-full rounded-2xl bg-court px-5 text-base font-black text-white transition hover:bg-court-dark disabled:opacity-60">
        {loading ? "Vérification…" : "Ouvrir le tableau de bord"}
      </button>
    </form>
  );
}
