import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAttendance } from "@/lib/data";
import { COMMITTEES, type CommitteeCode } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("committee");
  const committee = COMMITTEES.some((item) => item.code === requested) ? (requested as CommitteeCode) : undefined;
  try {
    return NextResponse.json(await getAttendance(committee), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de charger les présences.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
