/**
 * /cta — the D#3 field unit.
 *
 * A handheld on the screen (Treo-era bezel, CRT viewport, brass trim) over a
 * vaporwave horizon. Power on the camera, scan the QR on your own badge in the
 * little screen, watch the dossier decode, add a note if you like, transmit.
 *
 * Staff: three fingers on the screen (or triple-click) opens a password-locked panel with the
 * connect QR and the scanner mode (booth lead, Chris's session, game feedback). The mode
 * travels with every capture.
 *
 *   /cta        the unit
 *   /cta/admin  captures list, CSV export, printable booth QR (admin key)
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import { Link, useLocation } from "wouter";
import "./cta.css";

type Parsed = { kind: string; name?: string; email?: string; phone?: string; company?: string; title?: string; fields: Record<string, string> };
type Phase = "boot" | "scanning" | "acquired" | "transmitting" | "captured" | "manual";
type Mode = "booth" | "presentation" | "game";
const MODES: Record<Mode, { label: string; plate: string; noteLabel: string; prompt: string }> = {
  booth: { label: "Booth lead", plate: "BOOTH", noteLabel: "Add a note (optional)", prompt: "What are you interested in? Who should we loop in?" },
  presentation: { label: "Chris’s session", plate: "SESSION", noteLabel: "What should we follow up? (optional)", prompt: "What from the session do you want to dig into?" },
  game: { label: "Game feedback", plate: "GAME", noteLabel: "Your feedback on the game", prompt: "How was it? What would you change?" },
};
const STAFF_KEY = "cta-staff-key";
const loadMode = (): Mode => { try { const m = localStorage.getItem("cta-mode"); return m && m in MODES ? (m as Mode) : "booth"; } catch { return "booth"; } };
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

/* ------------------------------------------------------------------- sound */
// Tiny WebAudio synth. Every sound is a few oscillators, so nothing to download.
let audioCtx: AudioContext | null = null;
let soundMuted = (() => { try { return localStorage.getItem("cta-muted") === "1"; } catch { return false; } })();
function ac() {
  if (!audioCtx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!C) return null; audioCtx = new C(); }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}
function tone(ctx: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "square", gain = 0.05, slideTo?: number) {
  const t = ctx.currentTime + at; const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SFX: Record<string, (ctx: AudioContext) => void> = {
  power: (c) => { tone(c, 90, 0, 0.45, "sawtooth", 0.05, 720); tone(c, 1760, 0.42, 0.05, "square", 0.025); },
  tick: (c) => tone(c, 2400, 0, 0.022, "square", 0.035),
  lock: (c) => { tone(c, 880, 0, 0.08, "square", 0.05); tone(c, 1320, 0.08, 0.16, "square", 0.05); },
  transmit: (c) => { tone(c, 220, 0, 0.55, "sawtooth", 0.035, 1760); tone(c, 2637, 0.55, 0.12, "sine", 0.04); },
  chirp: (c) => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(c, f, i * 0.065, 0.1, "triangle", 0.05)),
  secret: (c) => [1568, 2093, 2637, 3136].forEach((f, i) => tone(c, f, i * 0.055, 0.2, "sine", 0.04)),
  night: (c) => { tone(c, 2600, 0, 0.35, "sine", 0.035, 700); tone(c, 60, 0, 0.3, "sine", 0.06); },
  degauss: (c) => { tone(c, 70, 0, 0.5, "sine", 0.2, 32); tone(c, 9000, 0.05, 1.1, "sawtooth", 0.008, 1800); },
  gold: (c) => [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => tone(c, f, i * 0.08, 0.35, "triangle", 0.05)),
};
function sfx(name: keyof typeof SFX) { if (soundMuted) return; const c = ac(); if (!c) return; try { SFX[name](c); } catch { /* ignore */ } }
const MORSE_D3 = "-.. ...--"; // D, 3 (there is no Morse for #)

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
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [contact, setContact] = useState("");
  const [mode, setModeState] = useState<Mode>(loadMode);
  const setMode = (m: Mode) => { setModeState(m); try { localStorage.setItem("cta-mode", m); } catch { /* ignore */ } sfx("tick"); buzz(10); };
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [glitch, setGlitch] = useState(false);
  // Five hidden things to find. Found ones persist on this device; all five turn the unit gold.
  const [found, setFound] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("cta-secrets") || "[]"); } catch { return []; } });
  const foundRef = useRef(found); foundRef.current = found;
  const [toast, setToast] = useState("");
  const discover = useCallback((key: string, label: string) => {
    if (foundRef.current.includes(key)) return;
    const next = [...foundRef.current, key]; foundRef.current = next; setFound(next);
    try { localStorage.setItem("cta-secrets", JSON.stringify(next)); } catch { /* ignore */ }
    if (next.length >= 5) { setToast("ALL FIVE FOUND · GOLD UNIT UNLOCKED"); window.setTimeout(() => sfx("gold"), 200); buzz([30, 40, 30, 40, 120]); }
    else { setToast(`SECRET FOUND · ${label} · ${next.length}/5`); sfx("secret"); buzz([20, 40, 20]); }
  }, []);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(id); }, [toast]);
  const gold = found.length >= 5;
  // Gold unlocked: the whole vaporwave sky turns gold too.
  useEffect(() => {
    const page = document.querySelector(".cta-page"); page?.classList.toggle("cta-page--gold", gold);
    return () => page?.classList.remove("cta-page--gold");
  }, [gold]);
  // 1. Phosphor dial
  const PHOS = ["aqua", "amber", "green", "magenta"] as const;
  const [phos, setPhos] = useState(0);
  const dialDrag = useRef<{ y: number; at: number; moved: boolean } | null>(null);
  const setDial = (i: number) => { const v = ((i % 4) + 4) % 4; if (v === phos) return; setPhos(v); sfx("tick"); buzz(8); if (v !== 0) discover("dial", "PHOSPHOR DIAL"); };
  // 2. AURA edge glow
  const [aura, setAura] = useState(false);
  const unitRef = useRef<HTMLDivElement | null>(null);
  // 3. Antenna
  const [antenna, setAntenna] = useState(false);
  const antennaDrag = useRef<number | null>(null);
  const [morseOn, setMorseOn] = useState<boolean | null>(null);
  const raiseAntenna = () => {
    const up = !antenna; setAntenna(up); document.querySelector(".cta-page")?.classList.toggle("cta-page--boost", up);
    if (!up) return;
    sfx("chirp"); buzz(15); discover("antenna", "ANTENNA");
    // Blink D#3 in Morse on the status light.
    const steps: [boolean, number][] = [];
    for (const ch of MORSE_D3) { if (ch === " ") { steps.push([false, 420]); continue; } steps.push([true, ch === "-" ? 420 : 140], [false, 140]); }
    let t = 300; steps.forEach(([on, ms]) => { window.setTimeout(() => setMorseOn(on), t); t += ms; }); window.setTimeout(() => setMorseOn(null), t + 200);
  };
  // 4. Night vision (three taps on the status light)
  const [night, setNight] = useState(false);
  const nightRef = useRef(false); nightRef.current = night;
  const ledTaps = useRef<number[]>([]);
  const tapLed = () => {
    const now = Date.now(); ledTaps.current = [...ledTaps.current.filter((t) => now - t < 1200), now];
    if (ledTaps.current.length < 3) return;
    ledTaps.current = []; const v = !nightRef.current; nightRef.current = v; setNight(v); sfx(v ? "night" : "tick"); buzz(v ? [20, 30, 20] : 20);
    if (v && !foundRef.current.includes("night")) discover("night", "NIGHT VISION"); else setToast(v ? "NIGHT VISION ON" : "NIGHT VISION OFF");
  };
  // 5. Degauss (press and hold the logo; shake where motion is allowed; D on a keyboard)
  const [degauss, setDegauss] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const [charging, setCharging] = useState(false);
  const holdStart = () => { setCharging(true); holdTimer.current = window.setTimeout(() => { holdTimer.current = null; setCharging(false); runDegaussRef.current(); }, 1300); };
  const holdEnd = () => { if (holdTimer.current) { window.clearTimeout(holdTimer.current); holdTimer.current = null; } setCharging(false); };
  const runDegaussRef = useRef<() => void>(() => undefined);
  // Triple-tap the logo: reset the passport (secrets and toggles) so the unit is ready for the next person.
  const logoTaps = useRef<number[]>([]);
  const resetPassport = () => {
    foundRef.current = []; setFound([]); try { localStorage.removeItem("cta-secrets"); } catch { /* ignore */ }
    setPhos(0); setAura(false); setNight(false); setAntenna(false); document.querySelector(".cta-page")?.classList.remove("cta-page--boost");
    setToast("PASSPORT RESET · 0/5"); sfx("power"); buzz([40, 30, 40]);
  };
  const logoUp = () => {
    const short = holdTimer.current !== null; holdEnd(); if (!short) return;
    const now = Date.now(); logoTaps.current = [...logoTaps.current.filter((t) => now - t < 900), now];
    if (logoTaps.current.length >= 3) { logoTaps.current = []; resetPassport(); }
  };
  const runDegauss = useCallback(() => {
    setDegauss(true); sfx("degauss"); buzz([60, 30, 60, 30, 120]); discover("degauss", "DEGAUSS");
    const page = document.querySelector(".cta-page"); page?.classList.add("cta-page--degauss");
    window.setTimeout(() => { setDegauss(false); page?.classList.remove("cta-page--degauss"); }, 2400);
  }, [discover]);
  runDegaussRef.current = runDegauss;
  useEffect(() => {
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration; let m = 0;
      if (a && a.x != null) m = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      else { const g = e.accelerationIncludingGravity; if (!g || g.x == null) return; m = Math.abs(Math.hypot(g.x ?? 0, g.y ?? 0, g.z ?? 0) - 9.81); }
      if (m > 17 && Date.now() - last > 2600) { last = Date.now(); runDegauss(); }
    };
    const onKey = (e: KeyboardEvent) => { const el = e.target as HTMLElement | null; if ((e.key === "d" || e.key === "D") && !(el && /INPUT|TEXTAREA/.test(el.tagName))) runDegauss(); };
    window.addEventListener("devicemotion", onMotion); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("devicemotion", onMotion); window.removeEventListener("keydown", onKey); };
  }, [runDegauss]);
  // Speaker grille: tap to mute
  const [muted, setMuted] = useState(soundMuted);
  const toggleMute = () => { const v = !muted; soundMuted = v; setMuted(v); try { localStorage.setItem("cta-muted", v ? "1" : "0"); } catch { /* ignore */ } if (!v) sfx("tick"); };
  // Hidden staff gesture: three fingers on the screen opens the staff panel (password, then connect QR + scanner mode).
  const [showQr, setShowQr] = useState(false);
  const [staffKey, setStaffKey] = useState(() => { try { return localStorage.getItem(STAFF_KEY) || ""; } catch { return ""; } });
  const [pw, setPw] = useState(""); const [pwError, setPwError] = useState(""); const [unlocking, setUnlocking] = useState(false);
  async function unlock() {
    setUnlocking(true); setPwError("");
    try {
      const r = await fetch(`${API}/staff`, { method: "POST", headers: { "x-admin-key": pw.trim() } });
      if (!r.ok) { setPwError(r.status === 401 ? "Wrong password" : "Could not check the password"); buzz([60, 40, 60]); return; }
      try { localStorage.setItem(STAFF_KEY, pw.trim()); } catch { /* ignore */ }
      setStaffKey(pw.trim()); setPw(""); sfx("secret");
    } catch { setPwError("Could not check the password"); } finally { setUnlocking(false); }
  }
  const lockStaff = () => { try { localStorage.removeItem(STAFF_KEY); } catch { /* ignore */ } setStaffKey(""); setShowQr(false); };
  // Keep the unit inside the viewport (the page is pinned, so it must never need to scroll):
  // when the content is taller than the screen, the CRT gives up the difference.
  useLayoutEffect(() => {
    const unit = unitRef.current; const page = unit?.closest(".cta-page") as HTMLElement | null; if (!unit || !page) return;
    const fit = () => {
      const crt = unit.querySelector(".cta-crt") as HTMLElement | null; if (!crt) return;
      unit.style.removeProperty("--crt-h");
      const over = page.scrollHeight - page.clientHeight;
      if (over > 0) unit.style.setProperty("--crt-h", `${Math.max(96, Math.floor(crt.getBoundingClientRect().height - over - 1))}px`);
      // Only let the page scroll (e.g. the hand-entry form on a short screen) when it truly has to; otherwise iOS can still rubber-band it.
      page.style.overflowY = page.scrollHeight > page.clientHeight + 1 ? "auto" : "hidden";
    };
    fit();
    const vv = window.visualViewport; window.addEventListener("resize", fit); vv?.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); vv?.removeEventListener("resize", fit); };
  });
  const screenRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = screenRef.current; if (!el) return;
    const onTouch = (e: TouchEvent) => { if (e.touches.length >= 3) { e.preventDefault(); buzz(30); setShowQr(true); } };
    el.addEventListener("touchstart", onTouch, { passive: false });
    return () => el.removeEventListener("touchstart", onTouch);
  }, []);
  useEffect(() => { if (!showQr) return; const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setShowQr(false); }; window.addEventListener("keydown", esc); return () => window.removeEventListener("keydown", esc); }, [showQr]);
  const onHit = useCallback((text: string) => {
    setPayload(text); setGlitch(true); buzz([40, 60, 40]); sfx("lock");
    window.setTimeout(() => { setGlitch(false); setPhase("acquired"); }, reduced() ? 0 : 650);
  }, []);
  const scanner = useScanner(phase === "scanning", onHit);
  useEffect(() => {
    const unit = unitRef.current; if (!aura || !unit) return;
    const canvas = document.createElement("canvas"); canvas.width = 8; canvas.height = 6; const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const id = window.setInterval(() => {
      const v = scanner.video.current;
      if (!v || v.readyState < 2 || !ctx) { unit.style.removeProperty("--aura"); return; }
      ctx.drawImage(v, 0, 0, 8, 6); const d = ctx.getImageData(0, 0, 8, 6).data; let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4, max = Math.max(r, g, b, 1) / n, k = 255 / max;
      unit.style.setProperty("--aura", `rgb(${Math.round((r / n) * k)},${Math.round((g / n) * k)},${Math.round((b / n) * k)})`);
    }, 280);
    return () => { window.clearInterval(id); unit.style.removeProperty("--aura"); };
  }, [aura, scanner.video]);
  const boot = useTypewriter("D#3 FIELD UNIT · CISCO LIVE 2026\nSYSTEMS NOMINAL. CAMERA OFFLINE.\nPOINT THE UNIT AT YOUR BADGE QR.", 22, phase === "boot" && !reduced());

  // Local preview of what the badge says; the server does the same parse and is the record.
  useEffect(() => { if (phase !== "acquired" || !payload) return; setParsed(previewParse(payload)); }, [phase, payload]);

  async function transmit(manual = false) {
    setError(""); setPhase("transmitting");
    try {
      const body = { ...(manual ? { payload: JSON.stringify({ name: name.trim(), email: email.trim() }), manual: true } : { payload, manual: false }), note: note.trim(), contact: contact.trim(), mode, gold };
      const r = await request<{ code: string; parsed: Parsed }>(`${API}/captures`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setCode(r.code); setParsed(r.parsed); buzz(80); sfx("transmit"); setPhase("captured");
    } catch (e) { setError((e as Error).message); setPhase(manual ? "manual" : "acquired"); }
  }
  function reset() { setPayload(""); setParsed(null); setNote(""); setContact(""); setCode(""); setError(""); setPhase("scanning"); }

  const led = phase === "boot" ? "idle" : phase === "scanning" ? "scan" : phase === "captured" ? "ok" : "lock";
  const ledClass = morseOn === null ? `cta-led--${led}` : morseOn ? "cta-led--morse-on" : "cta-led--morse-off";
  return <div ref={unitRef} data-phos={PHOS[phos]} className={`cta-unit ${glitch ? "is-glitch" : ""} cta-unit--${phase} ${aura ? "is-aura" : ""} ${night ? "is-night" : ""} ${degauss ? "is-degauss" : ""} ${gold ? "is-gold" : ""}`}>
    {toast ? <div className="cta-toast" role="status">{toast}</div> : null}
    <button type="button" className="cta-dial" aria-label={`Phosphor dial: ${PHOS[phos]}`} style={{ backgroundPositionY: `${phos * 9}px` }}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); dialDrag.current = { y: e.clientY, at: phos, moved: false }; }}
      onPointerMove={(e) => { const d = dialDrag.current; if (!d) return; const steps = Math.round((d.y - e.clientY) / 22); if (steps) { d.moved = true; setDial(d.at + steps); } }}
      onPointerUp={() => { const d = dialDrag.current; dialDrag.current = null; if (d && !d.moved) setDial(phos + 1); }}
      onPointerCancel={() => { dialDrag.current = null; }}><i /></button>
    <div className="cta-unit-top">
      <span className={`cta-antenna ${antenna ? "is-up" : ""}`} role="button" tabIndex={0} aria-label="Antenna" aria-pressed={antenna}
        onPointerDown={(e) => { antennaDrag.current = e.clientY; }} onPointerUp={(e) => { const y = antennaDrag.current; antennaDrag.current = null; if (y !== null && (y - e.clientY > 14 || Math.abs(y - e.clientY) < 6)) raiseAntenna(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); raiseAntenna(); } }} />
      <span className={`cta-brand ${charging ? "is-charging" : ""}`} role="button" tabIndex={0} aria-label="Data#3: press and hold" onPointerDown={holdStart} onPointerUp={logoUp} onPointerLeave={holdEnd} onPointerCancel={holdEnd} onContextMenu={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === "Enter") runDegauss(); }}>Data<sup>#</sup>3</span>
      {antenna ? <span className="cta-signal" aria-hidden="true"><i /><i /><i /><i /></span> : null}
      <button type="button" className={`cta-switch ${aura ? "is-on" : ""}`} aria-pressed={aura} onClick={() => { const v = !aura; setAura(v); sfx("tick"); buzz(8); if (v) discover("aura", "AURA"); }}><i /><span>AURA</span></button>
      <button type="button" className={`cta-led ${ledClass}`} aria-label="Status light" onClick={tapLed} />
    </div>
    <div className="cta-screen" ref={screenRef} onClick={(e) => { if (e.detail === 3) setShowQr(true); }}>
      <div className="cta-crt">
        {phase === "scanning" || glitch ? <><video ref={scanner.video} playsInline muted autoPlay /><div className="cta-reticle"><i /><i /><i /><i /></div><div className="cta-scanline" />{!scanner.ready && !scanner.error ? <p className="cta-screen-msg">WAKING CAMERA…</p> : null}{scanner.error ? <p className="cta-screen-msg cta-screen-msg--err">{scanner.error}</p> : null}</> : null}
        {phase === "boot" ? <pre className="cta-boot">{boot.shown}{boot.done ? "" : "▌"}</pre> : null}
        {phase === "acquired" || phase === "transmitting" ? <div className="cta-acquired"><p className="cta-stamp">IDENTITY ACQUIRED</p>{parsed ? <Dossier parsed={parsed} payload={payload} /> : null}</div> : null}
        {phase === "captured" ? <div className="cta-acquired cta-acquired--done"><p className="cta-stamp cta-stamp--ok">INFORMATION CAPTURED</p><p className="cta-code">REF {code}</p>{code.startsWith("GOLD") ? <p className="cta-gold-line">Gold unit. Show this screen at the Data#3 stand for your prize.</p> : null}{parsed?.name ? <p className="cta-thanks">Thanks, {parsed.name.split(" ")[0]}. We’ll be in touch.</p> : <p className="cta-thanks">Thanks. We’ll be in touch.</p>}</div> : null}
        {phase === "manual" ? <div className="cta-acquired"><p className="cta-stamp">MANUAL ENTRY</p><p className="cta-screen-note">No camera, no problem.</p></div> : null}
        <div className="cta-burn" aria-hidden="true">OBSERVE · GOVERN · SECURE</div>
        {degauss ? <div className="cta-degauss-fx" aria-hidden="true"><b /><i /></div> : null}
        <div className="cta-crt-glass" />
      </div>
      <div className="cta-screen-status"><span>{phase === "boot" ? "STANDBY" : phase === "scanning" ? (scanner.ready ? "SCANNING · ALIGN BADGE QR" : "CAMERA") : phase === "acquired" ? "LOCKED" : phase === "transmitting" ? "TRANSMITTING…" : phase === "captured" ? "SENT" : "KEYPAD"}</span><span className="cta-blink">●</span></div>
    </div>
    <div className="cta-keys">
      {phase === "boot" ? <><button className="cta-key cta-key--primary" onClick={() => { sfx("power"); setPhase("scanning"); }}>Power on camera</button><button className="cta-key cta-key--ghost" onClick={() => setPhase("manual")}>No camera? Enter by hand</button></> : null}
      {phase === "scanning" ? <><p className="cta-hint">Hold your badge QR inside the frame. It locks on by itself.</p><button className="cta-key cta-key--ghost" onClick={() => setPhase("manual")}>Enter by hand instead</button></> : null}
      {phase === "acquired" || phase === "transmitting" ? <><label className="cta-field">Additional contact details<input value={contact} maxLength={300} placeholder="Email, mobile, LinkedIn, whatever works" onChange={(e) => setContact(e.target.value)} /></label><label className="cta-field">{MODES[mode].noteLabel}<textarea value={note} maxLength={600} placeholder={MODES[mode].prompt} onChange={(e) => setNote(e.target.value)} /></label>{error ? <p className="cta-error">{error}</p> : null}<div className="cta-row"><button className="cta-key cta-key--ghost" onClick={reset} disabled={phase === "transmitting"}>Rescan</button><button className="cta-key cta-key--primary" onClick={() => transmit(false)} disabled={phase === "transmitting"}>{phase === "transmitting" ? "Transmitting…" : "Transmit"}</button></div></> : null}
      {phase === "manual" ? <><label className="cta-field">Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label><label className="cta-field">Email<input value={email} type="email" onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></label><label className="cta-field">Additional contact details<input value={contact} maxLength={300} placeholder="Email, mobile, LinkedIn, whatever works" onChange={(e) => setContact(e.target.value)} /></label><label className="cta-field">{MODES[mode].noteLabel}<textarea value={note} maxLength={600} placeholder={MODES[mode].prompt} onChange={(e) => setNote(e.target.value)} /></label>{error ? <p className="cta-error">{error}</p> : null}<div className="cta-row"><button className="cta-key cta-key--ghost" onClick={() => setPhase("scanning")}>Try the camera</button><button className="cta-key cta-key--primary" disabled={!name.trim() || !email.trim()} onClick={() => transmit(true)}>Transmit</button></div></> : null}
      {phase === "captured" ? <><p className="cta-hint">Pass the unit along, or scan another badge.</p><button className="cta-key cta-key--primary" onClick={reset}>Scan another</button></> : null}
    </div>
    {found.length ? <div className={`cta-tally ${found.length >= 5 ? "is-full" : ""}`} role="status" aria-label={`Secrets found: ${found.length} of 5`}>
      <span className="cta-tally-label">SECRETS</span>
      <span className="cta-tally-pips" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < found.length ? "is-lit" : ""} />)}</span>
      <span className="cta-tally-count">{found.length}<small>/5</small></span>
    </div> : null}
    <div className="cta-unit-foot"><span className="cta-model">{gold ? "GOLD UNIT" : "FIELD UNIT"} · {MODES[mode].plate}</span><button type="button" className="cta-grille" aria-label={muted ? "Sound off" : "Sound on"} aria-pressed={!muted} onClick={toggleMute} /></div>
    {showQr ? <div className="cta-qr-overlay" role="dialog" aria-modal="true" aria-label="Staff panel" onClick={() => setShowQr(false)}>
      {staffKey ? <div className="cta-qr-card" onClick={(e) => e.stopPropagation()}>
        <p className="cta-qr-kicker">UPLINK · SCAN TO CONNECT</p>
        <img src="/cta/connect-qr.png" alt="QR code to connect" onClick={() => setShowQr(false)} />
        <div className="cta-modes" role="radiogroup" aria-label="Scanner mode">
          <p className="cta-modes-kicker">SCANNER MODE</p>
          <div className="cta-modes-row">{(Object.keys(MODES) as Mode[]).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} className={`cta-mode ${mode === m ? "is-on" : ""}`} onClick={() => setMode(m)}>{MODES[m].label}</button>)}</div>
        </div>
        <div className="cta-modes-foot"><button type="button" className="cta-link" onClick={lockStaff}>Lock</button><button type="button" className="cta-key cta-key--ghost" onClick={() => setShowQr(false)}>Done</button></div>
      </div> : <form className="cta-qr-card cta-staff-lock" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (pw.trim() && !unlocking) void unlock(); }}>
        <p className="cta-qr-kicker">STAFF ACCESS</p>
        <label className="cta-field">Password<input type="password" value={pw} autoFocus autoComplete="current-password" onChange={(e) => setPw(e.target.value)} /></label>
        {pwError ? <p className="cta-error">{pwError}</p> : null}
        <div className="cta-row"><button type="button" className="cta-key cta-key--ghost" onClick={() => setShowQr(false)}>Cancel</button><button type="submit" className="cta-key cta-key--primary" disabled={!pw.trim() || unlocking}>{unlocking ? "Checking…" : "Unlock"}</button></div>
      </form>}
    </div> : null}
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

type Capture = { id: string; code: string; mode?: string; payload: string; parsed: Parsed; note: string; contact?: string; manual: boolean; userAgent: string; createdAt: string };

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
    <table className="cta-table"><thead><tr><th>When</th><th>Mode</th><th>Ref</th><th>Name</th><th>Email</th><th>Company</th><th>Other contact</th><th>Note</th><th>Kind</th><th /></tr></thead><tbody>{(rows ?? []).map((c) => <tr key={c.id}><td>{new Date(c.createdAt).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</td><td>{MODES[(c.mode ?? "booth") as Mode]?.plate.toLowerCase() ?? c.mode}</td><td><code>{c.code}</code></td><td>{c.parsed.name ?? ""}</td><td>{c.parsed.email ?? ""}</td><td>{c.parsed.company ?? ""}</td><td>{c.contact ?? ""}</td><td className="cta-note">{c.note}</td><td title={c.payload}>{c.manual ? "manual" : c.parsed.kind}</td><td><button className="cta-link" onClick={() => remove(c.id)}>delete</button></td></tr>)}</tbody></table>
  </div>;
}

/* -------------------------------------------------------------------- page */

export default function CtaCapture() {
  const [path] = useLocation();
  const admin = path.replace(/\/+$/, "").endsWith("/admin");
  // Pin the page so dragging on the dials and buttons can't pull the page or trigger pull-to-refresh.
  useEffect(() => {
    if (admin) return;
    const root = document.documentElement; root.classList.add("cta-lock");
    return () => root.classList.remove("cta-lock");
  }, [admin]);
  return <main className={`cta-page ${admin ? "cta-page--admin" : ""}`}>
    <div className="cta-sky" aria-hidden="true"><div className="cta-sun" /><div className="cta-grid" /></div>
    <div className="cta-scanlines" aria-hidden="true" />
    <Link href="/" className="cta-origin" aria-label="Back to the Data#3 Cisco Live home page"><span className="cta-origin-glyph" aria-hidden="true">◂</span><span className="cta-origin-label">ORIGIN</span><span className="cta-origin-pulse" aria-hidden="true" /></Link>
    {admin ? <CtaAdmin /> : <Unit />}
  </main>;
}
