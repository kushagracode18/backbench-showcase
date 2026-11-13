// Small, dependency-free security helpers. Pure functions so they can be unit-tested
// (see tests/security.test.ts). The database enforces the same rules; these keep bad
// input from ever leaving the browser and keep server details from reaching the screen.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (x: unknown): x is string => typeof x === "string" && UUID_RE.test(x);

/** Storage object path: <user id>/<uuid>.<ext>, the only shape the database accepts. */
export const STORAGE_PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,5}$/;
export const isStoragePath = (p: unknown): p is string => typeof p === "string" && STORAGE_PATH_RE.test(p);

/**
 * Where to go after login. Only same-site paths are allowed; anything that could leave the
 * site (//host, /\host, javascript:, control characters, absolute URLs) falls back.
 */
export function safeNext(n: string | null | undefined, fallback = "/profile"): string {
  if (!n || n.length > 300 || n[0] !== "/") return fallback;
  if (n.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(n)) return fallback;
  if (/%(?:[01][0-9a-f]|7f|5c)/i.test(n)) return fallback; // encoded control characters or backslash
  try {
    const base = "https://same-site.invalid";
    const u = new URL(n, base);
    if (u.origin !== base) return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

export type FileKind = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

/** Looks at the first bytes of a file to find out what it REALLY is (the browser-reported type can be faked). */
export async function sniffFileKind(file: Blob): Promise<FileKind | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const at = (i: number, ...v: number[]) => v.every((x, k) => b[i + k] === x);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  return null;
}

/** File extension we store, derived from the sniffed kind, never from the user's file name. */
export const extFor = (k: FileKind) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[k];

/**
 * Server errors can contain table names, constraint names or SQL. Only messages that our own
 * database functions raise on purpose (SQLSTATE P0001) are shown; everything else gets a generic line.
 */
export function pickSafeMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const { code, message } = body as { code?: unknown; message?: unknown };
  if (code !== "P0001" || typeof message !== "string") return null;
  const m = message.trim();
  return m.length > 0 && m.length <= 160 && /^[\w .,'’!?:;()\-–—/&%₹@]+$/.test(m) ? m : null;
}

/** Spreadsheet programs run cells that start with = + - @ (or tab/CR) as formulas. Neutralise them in CSV exports. */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Plain-text clamp for user text before it is sent. */
export const clampText = (s: string, max: number) => s.replace(/\u0000/g, "").trim().slice(0, max);
