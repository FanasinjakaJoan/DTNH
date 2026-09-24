import Link from "next/link";
import { CheckInForm } from "@/components/check-in-form";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-court text-2xl font-black text-white shadow-lg shadow-orange-200" aria-hidden="true">
              D
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-court-dark">DTNH</p>
              <p className="text-sm font-semibold text-ink/70">Dream Team New Hope</p>
            </div>
          </div>
          <Link href="/admin/login" className="rounded-full px-4 py-2 text-sm font-bold text-ink/60 transition hover:bg-white hover:text-ink">
            Accès admin
          </Link>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-white shadow-soft sm:px-10 sm:py-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-orange-300">Assemblée Générale · 26 septembre 2026</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Bienvenue au pointage DTNH</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Quelques informations suffisent pour confirmer votre présence et garder les membres du club à jour.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/85">
            <span className="rounded-full bg-white/10 px-4 py-2">1 · Je renseigne mes coordonnées</span>
            <span className="rounded-full bg-white/10 px-4 py-2">2 · Je choisis mon ou mes comités</span>
          </div>
        </section>

        <CheckInForm />

        <footer className="px-2 py-7 text-center text-xs leading-5 text-ink/50">
          Vos informations sont utilisées uniquement pour la gestion des membres et de la présence à l’Assemblée Générale.
        </footer>
      </div>
    </main>
  );
}
