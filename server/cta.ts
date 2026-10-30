/**
 * /cta — badge capture at the stand.
 *
 * A visitor scans the booth QR, lands on /cta, turns the camera on and scans
 * the QR on their own conference badge. Whatever the badge encodes is stored
 * raw, plus any fields we can parse from it (vCard, URL, JSON, plain ID), an
 * optional note, and the device it came from. Nothing on the badge is assumed:
 * last year's badge is the test fixture, this year's may differ.
 *
 * Public:  POST /api/cta/captures            { payload, note?, contact?, mode?, manual? }
 * Staff:   POST /api/cta/staff               unlock the staff panel (x-admin-key: the staff password, CTA_STAFF_KEY or any admin key)
 *          PUT  /api/cta/staff-password      { password } set the staff password (admin). Stored only as a salted
 *                                            scrypt hash in cta_settings, so it lives in the database, never in code.
 * Admin:   GET  /api/cta/captures            list (x-admin-key)
 *          GET  /api/cta/captures.csv        export (x-admin-key)
 *          DELETE /api/cta/captures/:id      (x-admin-key)
 * Admin key: any of CTA_ADMIN_KEY, DECISION_ROOM_ADMIN_KEY, WORKSHOP_FACILITATOR_SECRET, ADMIN_KEY.
 */

import type { Express, Request, Response } from "express";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "./db.js";

export type Parsed = { kind: "vcard" | "url" | "json" | "text"; name?: string; email?: string; phone?: string; company?: string; title?: string; fields: Record<string, string> };

const MODES = ["booth", "presentation", "game"] as const;
type Capture = { id: string; code: string; mode: string; payload: string; parsed: Parsed; note: string; contact: string; manual: boolean; userAgent: string; createdAt: string };

const memory: Capture[] = [];
let tableReady: Promise<void> | null = null;

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const ADMIN_NAMES = ["CTA_ADMIN_KEY", "DECISION_ROOM_ADMIN_KEY", "WORKSHOP_FACILITATOR_SECRET", "ADMIN_KEY"] as const;
function adminKeys() { const keys = ADMIN_NAMES.map((n) => (process.env[n] ?? "").trim()).filter(Boolean); if (!keys.length && process.env.NODE_ENV === "development") keys.push("decision-room-local"); return keys; }
const matches = (provided: string, keys: string[]) => Boolean(provided) && keys.some((k) => { const a = Buffer.from(sha(provided), "hex"), b = Buffer.from(sha(k), "hex"); return a.length === b.length && timingSafeEqual(a, b); });
function ensureAdmin(req: Request, res: Response) {
  if (!matches(String(req.headers["x-admin-key"] ?? "").trim(), adminKeys())) { res.status(401).json({ message: "Admin access required" }); return false; }
  return true;
}
/** Staff panel (connect QR + scanner mode). Its own key, so a booth password never opens the lead list. */
function staffKeys() { const k = (process.env.CTA_STAFF_KEY ?? "").trim(); return k ? [k, ...adminKeys()] : adminKeys(); }
const hashPassword = (pw: string, salt = randomBytes(16).toString("hex")) => `scrypt:${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
function checkPassword(pw: string, stored: string | null) {
  const [, salt, hex] = (stored ?? "").split(":"); if (!pw || !salt || !hex) return false;
  const a = Buffer.from(hashPassword(pw, salt).split(":")[2], "hex"), b = Buffer.from(hex, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
let memoryStaffHash: string | null = null;
let staffHashCache: { value: string | null; at: number } | null = null;
const rows = <T>(r: unknown) => (((r as { rows?: T[] })?.rows ?? r) as T[]);
const noDb = () => Boolean(process.env.VERCEL && !db);

async function ensureTable() {
  if (!db) return;
  if (!tableReady) tableReady = (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS cta_captures (id uuid PRIMARY KEY, code varchar(12) NOT NULL, payload text NOT NULL, parsed jsonb NOT NULL DEFAULT '{}'::jsonb, note text NOT NULL DEFAULT '', manual boolean NOT NULL DEFAULT false, user_agent text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`);
    await db.execute(sql`ALTER TABLE cta_captures ADD COLUMN IF NOT EXISTS mode varchar(16) NOT NULL DEFAULT 'booth'`);
    await db.execute(sql`ALTER TABLE cta_captures ADD COLUMN IF NOT EXISTS contact text NOT NULL DEFAULT ''`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS cta_settings (key varchar(64) PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  })().catch((e) => { tableReady = null; throw e; });
  return tableReady;
}

/** Best-effort read of a badge payload. Everything stays in `fields`; the named keys are conveniences. */
export function parsePayload(raw: string): Parsed {
  const text = raw.trim();
  if (/^BEGIN:VCARD/i.test(text)) {
    const fields: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z0-9-]+)(?:;[^:]*)?:(.*)$/); if (!m) continue;
      const key = m[1].toUpperCase(); const val = m[2].replace(/\\n/g, " ").replace(/\\,/g, ",").trim();
      if (val && !["BEGIN", "END", "VERSION"].includes(key)) fields[key] = fields[key] ? `${fields[key]} · ${val}` : val;
    }
    const n = fields.N ? fields.N.split(";").filter(Boolean) : [];
    return { kind: "vcard", name: fields.FN || (n.length ? `${n[1] ?? ""} ${n[0] ?? ""}`.trim() : undefined), email: fields.EMAIL, phone: fields.TEL, company: fields.ORG, title: fields.TITLE, fields };
  }
  if (/^https?:\/\//i.test(text)) {
    const fields: Record<string, string> = { URL: text };
    try { const u = new URL(text); u.searchParams.forEach((v, k) => { fields[k] = v; }); } catch { /* keep raw */ }
    return { kind: "url", email: fields.email, name: fields.name ?? fields.fn, fields };
  }
  if (/^\s*\{/.test(text)) {
    try { const o = JSON.parse(text) as Record<string, unknown>; const fields = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])); const pick = (...ks: string[]) => ks.map((k) => fields[k]).find(Boolean); return { kind: "json", name: pick("name", "fullName", "fn"), email: pick("email", "mail"), phone: pick("phone", "tel"), company: pick("company", "org", "organisation", "organization"), title: pick("title", "jobTitle"), fields }; } catch { /* fall through */ }
  }
  const fields: Record<string, string> = { ID: text };
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  if (email) fields.EMAIL = email;
  // Delimited badge strings ("12345^Jane Citizen^Acme^jane@acme.com") are common at conferences.
  const parts = text.split(/[|^~;\t]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) parts.forEach((p, i) => { fields[`F${i + 1}`] = p; });
  const name = parts.find((p) => /^[A-Za-z][A-Za-z' -]+ [A-Za-z][A-Za-z' -]+$/.test(p) && !/@/.test(p));
  const company = parts.find((p) => p !== name && !/@/.test(p) && !/^[A-Z0-9][A-Z0-9-]{3,}$/.test(p) && /[A-Za-z]{3}/.test(p) && !/^\+?\d[\d ()-]{6,}$/.test(p));
  return { kind: "text", email, name, company, fields };
}

const captureSchema = z.object({ payload: z.string().trim().min(1).max(4000), note: z.string().trim().max(600).default(""), contact: z.string().trim().max(300).default(""), mode: z.enum(MODES).default("booth"), manual: z.boolean().default(false), gold: z.boolean().default(false) });
const code = () => randomBytes(3).toString("hex").toUpperCase();

export function registerCtaRoutes(app: Express) {
  app.post("/api/cta/captures", async (req, res, next) => { try {
    if (noDb()) { res.status(503).json({ message: "Capture needs the production database" }); return; }
    const input = captureSchema.parse(req.body ?? {});
    const capture: Capture = { id: randomUUID(), code: input.gold ? `GOLD-${code()}` : code(), mode: input.mode, payload: input.payload, parsed: parsePayload(input.payload), note: input.note, contact: input.contact, manual: input.manual, userAgent: String(req.headers["user-agent"] ?? "").slice(0, 300), createdAt: new Date().toISOString() };
    if (db) { await ensureTable(); await db.execute(sql`INSERT INTO cta_captures(id,code,mode,payload,parsed,note,contact,manual,user_agent) VALUES(${capture.id}::uuid,${capture.code},${capture.mode},${capture.payload},${JSON.stringify(capture.parsed)}::jsonb,${capture.note},${capture.contact},${capture.manual},${capture.userAgent})`); }
    else memory.unshift(capture);
    res.status(201).json({ id: capture.id, code: capture.code, parsed: capture.parsed, createdAt: capture.createdAt });
  } catch (e) { if (e instanceof ZodError) { res.status(400).json({ message: e.issues[0]?.message ?? "Invalid request" }); return; } next(e); } });

  async function staffHash(): Promise<string | null> {
    if (!db) return memoryStaffHash;
    if (staffHashCache && Date.now() - staffHashCache.at < 30_000) return staffHashCache.value;
    await ensureTable();
    const value = rows<{ value: string }>(await db.execute(sql`SELECT value FROM cta_settings WHERE key='staff_password'`))[0]?.value ?? null;
    staffHashCache = { value, at: Date.now() }; return value;
  }

  app.post("/api/cta/staff", async (req, res, next) => { try {
    const provided = String(req.headers["x-admin-key"] ?? "").trim();
    if (!matches(provided, staffKeys()) && !checkPassword(provided, await staffHash())) { res.status(401).json({ message: "Wrong password" }); return; }
    res.json({ ok: true });
  } catch (e) { next(e); } });

  app.put("/api/cta/staff-password", async (req, res, next) => { try {
    if (!ensureAdmin(req, res)) return;
    const { password } = z.object({ password: z.string().trim().min(6).max(200) }).parse(req.body ?? {});
    const value = hashPassword(password);
    if (db) { await ensureTable(); await db.execute(sql`INSERT INTO cta_settings(key,value,updated_at) VALUES('staff_password',${value},now()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`); }
    else memoryStaffHash = value;
    staffHashCache = null;
    res.json({ ok: true });
  } catch (e) { if (e instanceof ZodError) { res.status(400).json({ message: "Password must be 6–200 characters" }); return; } next(e); } });

  async function list(): Promise<Capture[]> {
    if (!db) return memory;
    await ensureTable();
    return rows<any>(await db.execute(sql`SELECT * FROM cta_captures ORDER BY created_at DESC LIMIT 2000`)).map((r) => ({ id: r.id, code: r.code, mode: r.mode ?? "booth", payload: r.payload, parsed: r.parsed, note: r.note, contact: r.contact ?? "", manual: r.manual, userAgent: r.user_agent, createdAt: r.created_at }));
  }

  app.get("/api/cta/captures", async (req, res, next) => { try {
    if (!ensureAdmin(req, res)) return; if (noDb()) { res.status(503).json({ message: "No database" }); return; }
    res.json({ captures: await list() });
  } catch (e) { next(e); } });

  app.get("/api/cta/captures.csv", async (req, res, next) => { try {
    if (!ensureAdmin(req, res)) return; if (noDb()) { res.status(503).json({ message: "No database" }); return; }
    const cell = (v: unknown) => { let t = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; return `"${t.replace(/"/g, '""')}"`; };
    const header = ["captured_at", "code", "mode", "name", "email", "phone", "company", "title", "additional_contact", "kind", "note", "manual", "raw_payload", "all_fields", "device"];
    const lines = [header.map(cell).join(","), ...(await list()).map((c) => [c.createdAt, c.code, c.mode, c.parsed.name, c.parsed.email, c.parsed.phone, c.parsed.company, c.parsed.title, c.contact, c.parsed.kind, c.note, c.manual, c.payload, Object.entries(c.parsed.fields ?? {}).map(([k, v]) => `${k}=${v}`).join(" | "), c.userAgent].map(cell).join(","))];
    res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename="cta-captures-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`﻿${lines.join("\r\n")}`);
  } catch (e) { next(e); } });

  app.delete("/api/cta/captures/:id", async (req, res, next) => { try {
    if (!ensureAdmin(req, res)) return;
    const id = z.string().uuid().parse(req.params.id);
    if (db) { await ensureTable(); await db.execute(sql`DELETE FROM cta_captures WHERE id=${id}::uuid`); }
    else { const i = memory.findIndex((c) => c.id === id); if (i >= 0) memory.splice(i, 1); }
    res.json({ ok: true });
  } catch (e) { if (e instanceof ZodError) { res.status(400).json({ message: "Bad id" }); return; } next(e); } });
}
