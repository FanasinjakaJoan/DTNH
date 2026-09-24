import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 text-sm font-bold text-ink/60 hover:text-ink">
          <span aria-hidden="true">←</span> Retour au pointage
        </Link>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-9">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-2xl font-black text-white">D</div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-court-dark">Espace sécurisé</p>
          <h1 className="mt-2 text-3xl font-black">Tableau de bord</h1>
          <p className="mt-3 leading-6 text-ink/60">Entrez le mot de passe administrateur pour voir les présences.</p>
          <div className="mt-7">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
