import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, createAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!body.password || body.password !== adminPassword()) {
      return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    const isHttps = process.env.NODE_ENV === "production" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
      httpOnly: true,
      // The preview is embedded in an iframe. None keeps the session cookie available there.
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
