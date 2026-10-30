/**
 * /cta — the D#3 field unit.
 *
 * A handheld on the screen (Treo-era bezel, CRT viewport, brass trim) over a
 * vaporwave horizon. Power on the camera, scan the QR on your own badge in the
 * little screen, watch the dossier decode, add a note if you like, transmit.
 *
 *   /cta        the unit
 *   /cta/admin  captures list, CSV export, printable booth QR (admin key)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import { useLocation } from "wouter";
import "./cta.css";

type Parsed = { kind: string; name?: string; email?: string; phone?: string; company?: string; title?: string; fields: Record<string, string> };
type Phase = "boot" | "scanning" | "acquired" | "transmitting" | "captured" | "manual";
const API = "/api/cta";

/* ---------------------------------------------------------------- helpers */

async function request<T>(url: string, init: RequestInit = {}) {
  const r = await fetch(url, init); const body = await r.json().catch(() => ({ message: r.statusText }));
  if (!r.ok) throw new Error(body.message || "Request failed"); return body as T;
}
/** Types text out one character at a time, with a cursor while it runs. */
function useTypewriter(text: string, speed = 18, enabled = true) {
  const [shown, setShown] = useState(enabled ? "" : text);
  useEffect(() => {
    if (!enabled) { setShown(text); return; }
    setShown(""); let i = 0;
    const id = setInterval(() => { i += 1; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text, speed, enabled]);
  return { shown, done: shown.length >= text.length };
}
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function buzz(pattern: number | number[]) { try { navigator.vibrate?.(pattern); } catch { /* ignore */ } }

/* ------------------------------------------------------------------ camera */

/** Runs the rear camera into a <video>, decodes QR frames, hands back the first hit. */
function useScanner(active: boolean, onHit: (text: string) => void) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null; let raf = 0; let stop = false;
    const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const detector = "BarcodeDetector" in window ? new (window as any).BarcodeDetector({ formats: ["qr_code"] }) : null;
    let busy = false;
    const tick = async () => {
      if (stop) return;
      const v = video.current;
      if (v && v.readyState >= 2 && ctx && !busy) {
        busy = true;
        try {
          if (detector) {
            const codes = await detector.detect(v);
            if (codes?.[0]?.rawValue) { stop = true; onHit(String(codes[0].rawValue)); return; }
          } else {
            const w = Math.min(640, v.videoWidth || 640), h = Math.round(w * ((v.videoHeight || 480) / (v.videoWidth || 640)));
            canvas.width = w; canvas.height = h; ctx.drawImage(v, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const hit = jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
            if (hit?.data) { stop = true; onHit(hit.data); return; }
          }
        } catch { /* keep scanning */ } finally { busy = false; }
      }
      raf = window.setTimeout(tick, detector ? 120 : 90);
    };
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current; if (!v) return;
        v.srcObject = stream; await v.play().catch(() => undefined); setReady(true); tick();
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(name === "NotAllowedError" ? "Camera permission was refused. Allow the camera, or enter your details by hand." : name === "NotFoundError" ? "No camera found on this device." : window.isSecureContext ? "Could not start the camera." : "The camera needs a secure (https) page.");
      }
    })();
    return () => { stop = true; window.clearTimeout(raf); stream?.getTracks().forEach((t) => t.stop()); setReady(false); };
  }, [active, onHit]);
  return { video, error, ready };
}

/* -------------------------------------------------------------------- unit */

function Dossier({ parsed, payload }: { parsed: Parsed; payload: string }) {
  const rows = useMemo(() => {
    const r: [string, string][] = [];
    if (parsed.name) r.push(["SUBJECT", parsed.name]);
    if (parsed.title) r.push(["ROLE", parsed.title]);
    if (parsed.company) r.push(["ORG", parsed.company]);
    if (parsed.email) r.push(["MAIL", parsed.email]);
    if (parsed.phone) r.push(["TEL", parsed.phone]);
    const used = new Set(["FN", "N", "TITLE", "ORG", "EMAIL", "TEL", "name", "title", "company", "email", "phone", "URL", "ID"]);
    const known = new Set([parsed.name, parsed.email, parsed.phone, parsed.company, parsed.title].filter(Boolean));
    for (const [k, v] of Object.entries(parsed.fields)) if (!used.has(k) && !known.has(v) && r.length < 8) r.push([k.toUpperCase().slice(0, 10), v.slice(0, 60)]);
    if (!r.length) r.push(["PAYLOAD", payload.slice(0, 80)]);
    return r;
  }, [parsed, payload]);
  return <dl className="cta-dossier">{rows.map(([k, v], i) => <div key={k + i} style={{ animationDelay: `${0.25 + i * 0.16}s` }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

function Unit() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [payload, setPayload] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [note, setNote] = useState("");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [glitch, setGlitch] = useState(false);
  const onHit = useCallback((text: string) => {
    setPayload(text); setGlitch(true); buzz([40, 60, 40]);
    window.setTimeout(() => { setGlitch(false); setPhase("acquired"); }, reduced() ? 0 : 650);
  }, []);
  const scanner = useScanner(phase === "scanning", onHit);
  const boot = useTypewriter("D#3 FIELD UNIT · CISCO LIVE 2026\nSYSTEMS NOMINAL. CAMERA OFFLINE.\nPOINT THE UNIT AT YOUR BADGE QR.", 22, phase === "boot" && !reduced());

  // Local preview of what the badge says; the server does the same parse and is the record.
  useEffect(() => { if (phase !== "acquired" || !payload) return; setParsed(previewParse(payload)); }, [phase, payload]);

  async function transmit(manual = false) {
    setError(""); setPhase("transmitting");
    try {
      const body = manual ? { payload: JSON.stringify({ name: name.trim(), email: email.trim() }), note: note.trim(), manual: true } : { payload, note: note.trim(), manual: false };
      const r = await request<{ code: string; parsed: Parsed }>(`${API}/captures`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setCode(r.code); setParsed(r.parsed); buzz(80); setPhase("captured");
    } catch (e) { setError((e as Error).message); setPhase(manual ? "manual" : "acquired"); }
  }
  function reset() { setPayload(""); setParsed(null); setNote(""); setCode(""); setError(""); setPhase("scanning"); }

  const led = phase === "boot" ? "idle" : phase === "scanning" ? "scan" : phase === "captured" ? "ok" : "lock";
  return <div className={`cta-unit ${glitch ? "is-glitch" : ""} cta-unit--${phase}`}>
    <div className="cta-unit-top"><span className="cta-antenna" /><span className="cta-brand">Data<sup>#</sup>3</span><span className="cta-model">FIELD UNIT · CL26</span><span className={`cta-led cta-led--${led}`} /></div>
    <div className="cta-screen">
      <div className="cta-crt">
        {phase === "scanning" || glitch ? <><video ref={scanner.video} playsInline muted autoPlay /><div className="cta-reticle"><i /><i /><i /><i /></div><div className="cta-scanline" />{!scanner.ready && !scanner.error ? <p className="cta-screen-msg">WAKING CAMERA…</p> : null}{scanner.error ? <p className="cta-screen-msg cta-screen-msg--err">{scanner.error}</p> : null}</> : null}
        {phase === "boot" ? <pre className="cta-boot">{boot.shown}{boot.done ? "" : "▌"}</pre> : null}
        {phase === "acquired" || phase === "transmitting" ? <div className="cta-acquired"><p className="cta-stamp">IDENTITY ACQUIRED</p>{parsed ? <Dossier parsed={parsed} payload={payload} /> : null}</div> : null}
        {phase === "captured" ? <div className="cta-acquired cta-acquired--done"><p className="cta-stamp cta-stamp--ok">INFORMATION CAPTURED</p><p className="cta-code">REF {code}</p>{parsed?.name ? <p className="cta-thanks">Thanks, {parsed.name.split(" ")[0]}. We’ll be in touch.</p> : <p className="cta-thanks">Thanks. We’ll be in touch.</p>}</div> : null}
        {phase === "manual" ? <div className="cta-acquired"><p className="cta-stamp">MANUAL ENTRY</p><p className="cta-screen-note">No camera, no problem.</p></div> : null}
        <div className="cta-crt-glass" />
      </div>
      <div className="cta-screen-status"><span>{phase === "boot" ? "STANDBY" : phase === "scanning" ? (scanner.ready ? "SCANNING · ALIGN BADGE QR" : "CAMERA") : phase === "acquired" ? "LOCKED" : phase === "transmitting" ? "TRANSMITTING…" : phase === "captured" ? "SENT" : "KEYPAD"}</span><span className="cta-blink">●</span></div>
    </div>
    <div className="cta-keys">
      {phase === "boot" ? <><button className="cta-key cta-key--primary" onClick={() => setPhase("scanning")}>Power on camera</button><button className="cta-key cta-key--ghost" onClick={() => setPhase("manual")}>No camera? Enter by hand</button></> : null}
      {phase === "scanning" ? <><p className="cta-hint">Hold your badge QR inside the frame. It locks on by itself.</p><button className="cta-key cta-key--ghost" onClick={() => setPhase("manual")}>Enter by hand instead</button></> : null}
      {phase === "acquired" || phase === "transmitting" ? <><label className="cta-field">Add a note (optional)<textarea value={note} maxLength={600} placeholder="What are you interested in? Who should we loop in?" onChange={(e) => setNote(e.target.value)} /></label>{error ? <p className="cta-error">{error}</p> : null}<div className="cta-row"><button className="cta-key cta-key--ghost" onClick={reset} disabled={phase === "transmitting"}>Rescan</button><button className="cta-key cta-key--primary" onClick={() => transmit(false)} disabled={phase === "transmitting"}>{phase === "transmitting" ? "Transmitting…" : "Transmit"}</button></div></> : null}
      {phase === "manual" ? <><label className="cta-field">Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label><label className="cta-field">Email<input value={email} type="email" onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></label><label className="cta-field">Note (optional)<textarea value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} /></label>{error ? <p className="cta-error">{error}</p> : null}<div className="cta-row"><button className="cta-key cta-key--ghost" onClick={() => setPhase("scanning")}>Try the camera</button><button className="cta-key cta-key--primary" disabled={!name.trim() || !email.trim()} onClick={() => transmit(true)}>Transmit</button></div></> : null}
      {phase === "captured" ? <><p className="cta-hint">Pass the unit along, or scan another badge.</p><button className="cta-key cta-key--primary" onClick={reset}>Scan another</button></> : null}
    </div>
    <div className="cta-unit-foot"><span>DATA<sup>#</sup>3 × CISCO LIVE</span><span>OBSERVE · GOVERN · SECURE</span></div>
  </div>;
}

/** Mirror of the server parser, enough for the on-screen dossier before transmit. */
function previewParse(raw: string): Parsed {
  const text = raw.trim();
  if (/^BEGIN:VCARD/i.test(text)) {
    const fields: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) { const m = line.match(/^([A-Za-z0-9-]+)(?:;[^:]*)?:(.*)$/); if (!m) continue; const k = m[1].toUpperCase(), v = m[2].replace(/\\n/g, " ").replace(/\\,/g, ",").trim(); if (v && !["BEGIN", "END", "VERSION"].includes(k)) fields[k] = fields[k] ? `${fields[k]} · ${v}` : v; }
    const n = fields.N ? fields.N.split(";").filter(Boolean) : [];
    return { kind: "vcard", name: fields.FN || (n.length ? `${n[1] ?? ""} ${n[0] ?? ""}`.trim() : undefined), email: fields.EMAIL, phone: fields.TEL, company: fields.ORG, title: fields.TITLE, fields };
  }
  if (/^https?:\/\//i.test(text)) { const fields: Record<string, string> = { URL: text }; try { new URL(text).searchParams.forEach((v, k) => { fields[k] = v; }); } catch { /* raw */ } return { kind: "url", email: fields.email, name: fields.name, fields }; }
  if (/^\s*\{/.test(text)) { try { const o = JSON.parse(text); const fields = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])) as Record<string, string>; return { kind: "json", name: fields.name ?? fields.fullName, email: fields.email, phone: fields.phone, company: fields.company ?? fields.org, title: fields.title, fields }; } catch { /* fall */ } }
  const fields: Record<string, string> = { ID: text }; const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]; if (email) fields.EMAIL = email;
  const parts = text.split(/[|^~;\t]/).map((s) => s.trim()).filter(Boolean); if (parts.length >= 2) parts.forEach((p, i) => { fields[`F${i + 1}`] = p; });
  const name = parts.find((p) => /^[A-Za-z][A-Za-z' -]+ [A-Za-z][A-Za-z' -]+$/.test(p) && !/@/.test(p));
  const company = parts.find((p) => p !== name && !/@/.test(p) && !/^[A-Z0-9][A-Z0-9-]{3,}$/.test(p) && /[A-Za-z]{3}/.test(p) && !/^\+?\d[\d ()-]{6,}$/.test(p));
  return { kind: "text", email, name, company, fields };
}

/* ------------------------------------------------------------------- admin */

type Capture = { id: string; code: string; payload: string; parsed: Parsed; note: string; manual: boolean; userAgent: string; createdAt: string };

function CtaAdmin() {
  const [key, setKey] = useState(() => { try { return localStorage.getItem("decision-room-admin-key") || ""; } catch { return ""; } });
  const [draft, setDraft] = useState("");
  const [rows, setRows] = useState<Capture[] | null>(null); const [error, setError] = useState("");
  const headers = useMemo(() => ({ "x-admin-key": key }), [key]);
  const load = useCallback(async () => { if (!key) return; try { setRows((await request<{ captures: Capture[] }>(`${API}/captures`, { headers })).captures); setError(""); } catch (e) { setError((e as Error).message); } }, [key, headers]);
  useEffect(() => { void load(); const id = setInterval(() => void load(), 8000); return () => clearInterval(id); }, [load]);
  async function exportCsv() { const r = await fetch(`${API}/captures.csv`, { headers }); if (!r.ok) { setError("Export failed"); return; } const url = URL.createObjectURL(await r.blob()); const a = document.createElement("a"); a.href = url; a.download = `cta-captures.csv`; a.click(); URL.revokeObjectURL(url); }
  async function remove(id: string) { if (!confirm("Delete this capture?")) return; await fetch(`${API}/captures/${id}`, { method: "DELETE", headers }); void load(); }
  const boothUrl = `${location.origin}/cta`;
  if (!key) return <div className="cta-admin"><h1>Capture admin</h1><label className="cta-field">Admin key<input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} /></label><button className="cta-key cta-key--primary" disabled={!draft.trim()} onClick={() => { try { localStorage.setItem("decision-room-admin-key", draft.trim()); } catch { /* ignore */ } setKey(draft.trim()); }}>Open</button></div>;
  return <div className="cta-admin">
    <header><div><h1>Badge captures</h1><p>{rows ? `${rows.length} captured` : "Loading…"}{error ? ` · ${error}` : ""}</p></div><div className="cta-row"><button className="cta-key cta-key--ghost" onClick={() => window.print()}>Print booth QR</button><button className="cta-key cta-key--primary" onClick={exportCsv}>Export CSV</button></div></header>
    <section className="cta-booth"><div className="cta-booth-qr"><QRCodeSVG value={boothUrl} size={220} level="H" bgColor="#ffffff" fgColor="#000025" /></div><div><p className="cta-booth-kicker">SCAN TO CHECK IN</p><h2>Point your phone here</h2><p>{boothUrl}</p></div></section>
    <table className="cta-table"><thead><tr><th>When</th><th>Ref</th><th>Name</th><th>Email</th><th>Company</th><th>Note</th><th>Kind</th><th /></tr></thead><tbody>{(rows ?? []).map((c) => <tr key={c.id}><td>{new Date(c.createdAt).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</td><td><code>{c.code}</code></td><td>{c.parsed.name ?? ""}</td><td>{c.parsed.email ?? ""}</td><td>{c.parsed.company ?? ""}</td><td className="cta-note">{c.note}</td><td title={c.payload}>{c.manual ? "manual" : c.parsed.kind}</td><td><button className="cta-link" onClick={() => remove(c.id)}>delete</button></td></tr>)}</tbody></table>
  </div>;
}

/* -------------------------------------------------------------------- page */

export default function CtaCapture() {
  const [path] = useLocation();
  const admin = path.replace(/\/+$/, "").endsWith("/admin");
  return <main className={`cta-page ${admin ? "cta-page--admin" : ""}`}>
    <div className="cta-sky" aria-hidden="true"><div className="cta-sun" /><div className="cta-grid" /></div>
    <div className="cta-scanlines" aria-hidden="true" />
    {admin ? <CtaAdmin /> : <Unit />}
  </main>;
}
