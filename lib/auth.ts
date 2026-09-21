import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "dtnh_admin_session";

function secret() {
  return process.env.AUTH_SECRET || "dtnh-local-demo-secret-change-me";
}

function signature(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAdminToken() {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${signature(payload)}`;
}

export function isValidAdminToken(token?: string) {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = signature(payload);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function isAdminRequest() {
  return isValidAdminToken(cookies().get(ADMIN_COOKIE)?.value);
}

export function adminPassword() {
  // The fallback keeps the local preview usable. Set ADMIN_PASSWORD in production.
  return process.env.ADMIN_PASSWORD || "DTNH2026";
}
