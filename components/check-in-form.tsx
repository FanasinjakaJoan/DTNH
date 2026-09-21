"use client";

import { FormEvent, useState } from "react";
import { parseNames } from "@/lib/format";
import { COMMITTEES, type CheckInInput, type CommitteeCode } from "@/lib/types";

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  committees: [] as CommitteeCode[],
  childrenText: "",
  parentsText: "",
};

export function CheckInForm() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [alreadyPresent, setAlreadyPresent] = useState(false);

  function toggleCommittee(code: CommitteeCode) {
    setForm((current) => ({
      ...current,
      committees: current.committees.includes(code)
        ? current.committees.filter((item) => item !== code)
        : [...current.committees, code],
    }));
  }

  function update(field: "firstName" | "lastName" | "phone" | "email" | "childrenText" | "parentsText", value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setAlreadyPresent(false);

    const children = parseNames(form.childrenText);
    const parents = parseNames(form.parentsText);
    const payload: CheckInInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      committees: form.committees,
      children,
      parents,
    };

    if (!payload.firstName || !payload.lastName || !payload.phone) {
      setStatus("error");
      setMessage("Le prénom, le nom et le téléphone sont obligatoires.");
      return;
    }
    if (!payload.committees.length) {
      setStatus("error");
      setMessage("Choisissez au moins un comité.");
      return;
    }
    if (payload.committees.includes("parents") && !children.length) {
      setStatus("error");
      setMessage("Ajoutez au moins un nom de joueur pour le comité des parents.");
      return;
    }
    if (payload.committees.includes("joueurs") && !parents.length) {
      setStatus("error");
      setMessage("Ajoutez au moins un nom de parent pour le comité des joueurs.");
      return;
    }

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; alreadyPresent?: boolean; memberName?: string };
      if (!response.ok) throw new Error(result.error || "Une erreur est survenue.");
      setAlreadyPresent(Boolean(result.alreadyPresent));
      setMessage(result.memberName ? `${result.memberName}, votre présence est enregistrée.` : "Votre présence est enregistrée.");
      setStatus("success");
      setForm(emptyForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer votre présence.");
    }
  }

  const hasParents = form.committees.includes("parents");
  const hasPlayers = form.committees.includes("joueurs");

  if (status === "success") {
    return (
      <section className="rounded-[2rem] border border-green-200 bg-mint p-7 shadow-soft sm:p-10" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-black text-white" aria-hidden="true">
          ✓
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-green-800">Pointage confirmé</p>
        <h2 className="mt-2 text-3xl font-black text-ink">Merci, c’est enregistré !</h2>
        <p className="mt-3 max-w-xl text-lg leading-7 text-ink/70">{message}</p>
        {alreadyPresent && <p className="mt-2 text-sm font-semibold text-ink/60">Votre présence était déjà enregistrée, nous n’avons pas créé de doublon.</p>}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
            setAlreadyPresent(false);
          }}
          className="mt-8 min-h-14 rounded-2xl bg-ink px-6 text-base font-black text-white transition hover:bg-court"
        >
          Enregistrer une autre personne
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 shadow-soft sm:p-9" noValidate>
      <div className="mb-8 flex items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-court-dark">Étape 1</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Qui êtes-vous ?</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">Les champs avec une étoile sont obligatoires.</p>
        </div>
        <div className="hidden rounded-2xl bg-sky px-4 py-3 text-center text-xs font-bold text-ink/70 sm:block">
          <span className="block text-2xl" aria-hidden="true">🏀</span>
          Simple et rapide
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">Prénom <span className="text-court-dark">*</span></span>
          <input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-lg outline-none transition placeholder:text-ink/35 focus:border-court" placeholder="Ex. Marie" autoComplete="given-name" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">Nom <span className="text-court-dark">*</span></span>
          <input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-lg outline-none transition placeholder:text-ink/35 focus:border-court" placeholder="Ex. Dupont" autoComplete="family-name" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">Téléphone <span className="text-court-dark">*</span></span>
          <input value={form.phone} onChange={(event) => update("phone", event.target.value)} className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-lg outline-none transition placeholder:text-ink/35 focus:border-court" placeholder="Ex. 06 12 34 56 78" inputMode="tel" autoComplete="tel" required />
          <span className="mt-2 block text-xs text-ink/50">Le téléphone est notre contact principal.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">Email <span className="font-normal text-ink/50">(facultatif)</span></span>
          <input value={form.email} onChange={(event) => update("email", event.target.value)} className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-lg outline-none transition placeholder:text-ink/35 focus:border-court" placeholder="vous@exemple.fr" type="email" autoComplete="email" />
        </label>
      </div>

      <fieldset className="mt-9">
        <legend className="text-sm font-extrabold">Votre ou vos comités <span className="text-court-dark">*</span></legend>
        <p className="mt-2 text-sm leading-6 text-ink/60">Vous pouvez sélectionner plusieurs comités.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {COMMITTEES.map((committee) => {
            const selected = form.committees.includes(committee.code);
            return (
              <label key={committee.code} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 transition ${selected ? "border-court bg-orange-50" : "border-line bg-paper hover:border-court/50"}`}>
                <input type="checkbox" checked={selected} onChange={() => toggleCommittee(committee.code)} className="h-5 w-5 accent-court" />
                <span className="font-bold">{committee.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {(hasParents || hasPlayers) && (
        <div className="mt-9 space-y-5 rounded-3xl bg-sky p-5 sm:p-6">
          <div>
            <p className="text-sm font-black">Les liens famille / joueur</p>
            <p className="mt-1 text-sm leading-6 text-ink/65">Un nom par ligne. Ces informations permettent de relier les membres du club.</p>
          </div>
          {hasParents && (
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold">Nom(s) du ou des enfant(s) joueur(s) <span className="text-court-dark">*</span></span>
              <textarea value={form.childrenText} onChange={(event) => update("childrenText", event.target.value)} className="min-h-28 w-full rounded-2xl border-2 border-white bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-court" placeholder={'Ex.\nLucas Dupont\nEmma Dupont'} />
            </label>
          )}
          {hasPlayers && (
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold">Nom(s) du ou des parent(s) <span className="text-court-dark">*</span></span>
              <textarea value={form.parentsText} onChange={(event) => update("parentsText", event.target.value)} className="min-h-28 w-full rounded-2xl border-2 border-white bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-court" placeholder={'Ex.\nMarie Dupont'} />
            </label>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800" role="alert">
          {message}
        </div>
      )}

      <button type="submit" disabled={status === "loading"} className="mt-8 min-h-16 w-full rounded-2xl bg-court px-6 text-lg font-black text-white shadow-lg shadow-orange-200 transition hover:bg-court-dark disabled:cursor-wait disabled:opacity-60">
        {status === "loading" ? "Enregistrement…" : "Confirmer ma présence"}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-ink/50">En validant, vous confirmez que ces informations peuvent être utilisées pour la gestion des membres de DTNH.</p>
    </form>
  );
}
