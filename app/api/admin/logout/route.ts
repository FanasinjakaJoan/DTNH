import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  const isHttps = process.env.NODE_ENV === "production" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps,
    path: "/",
    maxAge: 0,
  });
  return response;
}
