"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { COMMITTEES, type AttendanceResponse, type CommitteeCode } from "@/lib/types";

export function AdminDashboard() {
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [filter, setFilter] = useState<"all" | CommitteeCode>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = filter === "all" ? "" : `?committee=${encodeURIComponent(filter)}`;
      const response = await fetch(`/api/attendance${query}`, { cache: "no-store", credentials: "include" });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const result = (await response.json()) as AttendanceResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Impossible de charger les présences.");
      setData(result);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les présences.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  const visibleRows = useMemo(() => data?.rows || [], [data]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }

  const exportUrl = filter === "all" ? "/api/attendance/export" : `/api/attendance/export?committee=${filter}`;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-8">
          <div>
            <Link href="/" className="text-sm font-bold text-court-dark hover:underline">← Retour au pointage</Link>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Présences · AG 2026</h1>
            <p className="mt-2 text-sm text-ink/60">Actualisation automatique toutes les 5 secondes.</p>
          </div>
          <button type="button" onClick={logout} className="rounded-full border-2 border-line bg-white px-5 py-3 text-sm font-black transition hover:border-ink">Se déconnecter</button>
        </header>

        {error && <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl bg-ink p-5 text-white shadow-soft lg:col-span-1">
            <p className="text-sm font-bold text-white/65">Total présent</p>
            <p className="mt-2 text-4xl font-black">{data?.totalPresent ?? "—"}</p>
            <p className="mt-2 text-xs font-semibold text-white/55">membre(s) pointé(s)</p>
          </div>
          {COMMITTEES.map((committee) => (
            <div key={committee.code} className="rounded-3xl bg-white p-5 shadow-soft">
              <p className="text-sm font-bold text-ink/60">{committee.shortLabel}</p>
              <p className="mt-2 text-4xl font-black">{data?.totals[committee.code] ?? "—"}</p>
              <p className="mt-2 text-xs font-semibold text-ink/45">membre(s)</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-court-dark">Liste en temps quasi réel</p>
              <h2 className="mt-2 text-2xl font-black">Membres présents</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border-2 border-line bg-paper px-4 text-sm font-bold">
                <span className="whitespace-nowrap">Filtrer :</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value as "all" | CommitteeCode)} className="bg-transparent outline-none">
                  <option value="all">Tous les comités</option>
                  {COMMITTEES.map((committee) => <option key={committee.code} value={committee.code}>{committee.label}</option>)}
                </select>
              </label>
              <a href={exportUrl} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-court px-5 text-sm font-black text-white transition hover:bg-court-dark">Télécharger le CSV</a>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            {loading && !data ? (
              <div className="rounded-2xl bg-paper px-5 py-10 text-center font-bold text-ink/55">Chargement des présences…</div>
            ) : visibleRows.length === 0 ? (
              <div className="rounded-2xl bg-paper px-5 py-10 text-center">
                <p className="text-lg font-black">Aucun pointage pour le moment</p>
                <p className="mt-2 text-sm text-ink/55">Les nouveaux membres apparaîtront ici automatiquement.</p>
              </div>
            ) : (
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-xs uppercase tracking-wide text-ink/50">
                    <th className="px-3 py-4 font-black">Membre</th>
                    <th className="px-3 py-4 font-black">Comité(s)</th>
                    <th className="px-3 py-4 font-black">Contact</th>
                    <th className="px-3 py-4 font-black">Lien joueur / parent</th>
                    <th className="px-3 py-4 font-black">Pointé à</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-paper">
                      <td className="px-3 py-4 font-black">{row.firstName} {row.lastName}</td>
                      <td className="px-3 py-4"><div className="flex max-w-xs flex-wrap gap-1.5">{row.committees.map((code) => <span key={code} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-court-dark">{COMMITTEES.find((item) => item.code === code)?.shortLabel}</span>)}</div></td>
                      <td className="px-3 py-4 text-ink/70"><div>{row.phone}</div>{row.email && <div className="text-xs">{row.email}</div>}</td>
                      <td className="max-w-xs px-3 py-4 text-ink/70">{row.linkedPlayers.length > 0 ? `Joueur(s) : ${row.linkedPlayers.join(", ")}` : row.linkedParents.length > 0 ? `Parent(s) : ${row.linkedParents.join(", ")}` : <span className="text-ink/35">—</span>}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-ink/60">{formatDateTime(row.checkedInAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
