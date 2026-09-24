export function normalizePhone(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

export function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseNames(value: string) {
  return value
    .split(/[\n,;]+/)
    .map(cleanName)
    .filter(Boolean);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
