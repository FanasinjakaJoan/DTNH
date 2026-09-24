import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAttendance } from "@/lib/data";
import { csvEscape } from "@/lib/format";
import { COMMITTEES, type CommitteeCode } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("committee");
  const committee = COMMITTEES.some((item) => item.code === requested) ? (requested as CommitteeCode) : undefined;
  try {
    const data = await getAttendance(committee);
    const header = ["Prénom", "Nom", "Téléphone", "Email", "Comité(s)", "Joueur(s) lié(s)", "Parent(s) lié(s)", "Pointé à"];
    const lines = data.rows.map((row) => [
      row.firstName,
      row.lastName,
      row.phone,
      row.email || "",
      row.committees.join(", "),
      row.linkedPlayers.join(", "),
      row.linkedParents.join(", "),
      row.checkedInAt,
    ].map(csvEscape).join(";"));
    const csv = [header.map(csvEscape).join(";"), ...lines].join("\n");
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dtnh-presences-${data.event.date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de générer le CSV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
