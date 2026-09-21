import { NextResponse } from "next/server";
import { registerCheckIn } from "@/lib/data";
import { cleanName, parseNames } from "@/lib/format";
import { COMMITTEES, type CheckInInput, type CommitteeCode } from "@/lib/types";

function isCommitteeCode(value: unknown): value is CommitteeCode {
  return typeof value === "string" && COMMITTEES.some((committee) => committee.code === value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CheckInInput> & { children?: unknown; parents?: unknown };
    const committees = Array.isArray(body.committees) ? body.committees.filter(isCommitteeCode) : [];
    const children = Array.isArray(body.children)
      ? body.children.map((value) => cleanName(String(value))).filter(Boolean)
      : typeof body.children === "string"
        ? parseNames(body.children)
        : [];
    const parents = Array.isArray(body.parents)
      ? body.parents.map((value) => cleanName(String(value))).filter(Boolean)
      : typeof body.parents === "string"
        ? parseNames(body.parents)
        : [];

    const input: CheckInInput = {
      firstName: cleanName(String(body.firstName || "")),
      lastName: cleanName(String(body.lastName || "")),
      phone: String(body.phone || "").trim(),
      email: typeof body.email === "string" ? body.email.trim() : undefined,
      committees,
      children,
      parents,
    };

    const result = await registerCheckIn(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d’enregistrer le pointage.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
