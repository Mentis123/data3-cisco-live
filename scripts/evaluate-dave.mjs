import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";
import WebSocket from "ws";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const references = join(repo, "docs", "dave-reference");
const output = resolve(process.env.DAVE_EVAL_OUTPUT || await mkdtemp(join(tmpdir(), "dave-eval-")));
const chromeProfile = await mkdtemp(join(tmpdir(), "dave-chrome-"));
const vitePort = 4175 + Math.floor(Math.random() * 400);
const cdpPort = 9222 + Math.floor(Math.random() * 400);
const anchors = [9, 39, 69, 99, 129, 159, 189, 219, 240];

async function findExecutable(directory, names, depth = 4) {
  if (!directory || depth < 0 || !existsSync(directory)) return undefined;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isFile() && names.includes(entry.name)) return path;
    if (entry.isDirectory()) {
      const result = await findExecutable(path, names, depth - 1);
      if (result) return result;
    }
  }
  return undefined;
}

async function findChromium() {
  const configured = [process.env.DAVE_CHROMIUM, process.env.CHROME_PATH].filter(Boolean);
  const standard = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const direct = [...configured, ...standard].find((path) => existsSync(path));
  if (direct) return direct;
  const cached = await findExecutable(
    join(homedir(), ".cache", "ms-playwright"),
    ["chrome-headless-shell", "chrome"],
  );
  if (cached) return cached;
  throw new Error("Chromium not found. Set DAVE_CHROMIUM to a Chrome/Chromium executable.");
}

async function waitFor(test, label, attempts = 120) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const value = await test();
      if (value) return value;
    } catch {
      // The service or page is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolvePromise, reject) => {
      this.socket.once("open", resolvePromise);
      this.socket.once("error", reject);
    });
    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());
      if (!message.id) {
        for (const listener of this.listeners.get(message.method) || []) {
          listener(message.params);
        }
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  close() {
    this.socket.close();
  }
}

function activeTime(frame) {
  return (frame - 9 - Math.floor((frame - 5) / 6)) / 25;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || "Browser evaluation failed.");
  }
  return result.result.value;
}

async function capture(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  const path = join(output, name);
  await writeFile(path, Buffer.from(result.data, "base64"));
  return path;
}

function imageMetrics(referencePath, actualPath, region) {
  return Promise.all([readFile(referencePath), readFile(actualPath)]).then(([left, right]) => {
    const reference = PNG.sync.read(left);
    const actual = PNG.sync.read(right);
    if (reference.width !== actual.width || reference.height !== actual.height) {
      throw new Error(`Image dimensions differ for ${actualPath}.`);
    }
    const [x0, y0, x1, y1] = region || [0, 0, reference.width, reference.height];
    let absolute = 0;
    let squared = 0;
    let samples = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const offset = (y * reference.width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const difference = reference.data[offset + channel] - actual.data[offset + channel];
          absolute += Math.abs(difference);
          squared += difference * difference;
          samples += 1;
        }
      }
    }
    return { mae: absolute / samples, rmse: Math.sqrt(squared / samples) };
  });
}

function assertClose(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual}.`);
  }
}

function countDifferentPixels(left, right) {
  const first = PNG.sync.read(left);
  const second = PNG.sync.read(right);
  let count = 0;
  for (let offset = 0; offset < first.data.length; offset += 4) {
    if (
      first.data[offset] !== second.data[offset]
      || first.data[offset + 1] !== second.data[offset + 1]
      || first.data[offset + 2] !== second.data[offset + 2]
    ) count += 1;
  }
  return count;
}

await mkdir(output, { recursive: true });
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(vitePort), "--strictPort"],
  { cwd: repo, stdio: ["ignore", "pipe", "pipe"] },
);
let chrome;
let cdp;

try {
  await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${vitePort}/dave?qa=1`);
    return response.ok;
  }, "Vite");

  chrome = spawn(await findChromium(), [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${chromeProfile}`,
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "about:blank",
  ], { stdio: "ignore" });

  const target = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
    const targets = await response.json();
    return targets.find((item) => item.type === "page");
  }, "Chromium DevTools");

  cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.open();
  const pageErrors = [];
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    pageErrors.push(exceptionDetails.exception?.description || exceptionDetails.text);
  });
  cdp.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error" && entry.source === "javascript") pageErrors.push(entry.text);
  });
  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Log.enable"),
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 512,
      height: 512,
      deviceScaleFactor: 1,
      mobile: false,
    }),
  ]);
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__daveContextLosses = 0;
      document.addEventListener("webglcontextlost", () => {
        window.__daveContextLosses += 1;
      }, true);
    `,
  });
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${vitePort}/dave?qa=1` });
  await waitFor(
    () => evaluate(cdp, "Boolean(window.__DAVE_QA__?.ready && document.querySelector(\"canvas[data-ready='true']\"))"),
    "Dave WebGL scene",
  );

  const metrics = [];
  const states = [];
  for (const frame of anchors) {
    await evaluate(cdp, `window.__DAVE_QA__.setSourceFrame(${frame})`);
    const state = await evaluate(cdp, "window.__DAVE_QA__.getPhysicsState()");
    const time = activeTime(frame);
    assertClose(state.activeTime, time, 1e-9, `frame ${frame} active time`);
    assertClose(state.rootYawDegrees, 60.5 + 45 * time, 1e-7, `frame ${frame} yaw`);
    state.contact.forEach((coordinate, axis) => {
      assertClose(coordinate, 0, 1e-6, `frame ${frame} contact axis ${axis}`);
    });
    if (state.mirrorCount !== 6) throw new Error(`Expected six mirrors, got ${state.mirrorCount}.`);
    states.push({ frame, ...state });

    const actual = await capture(cdp, `frame-${String(frame).padStart(4, "0")}.png`);
    const reference = join(references, `frame-${String(frame).padStart(4, "0")}.png`);
    metrics.push({
      frame,
      full: await imageMetrics(reference, actual),
      cube: await imageMetrics(reference, actual, [60, 70, 452, 445]),
      center: await imageMetrics(reference, actual, [130, 125, 382, 380]),
    });
  }

  await evaluate(cdp, "window.__DAVE_QA__.setSourceFrame(99)");
  const deterministicA = await capture(cdp, "history-a.png");
  await evaluate(cdp, "window.__DAVE_QA__.setSourceFrame(219)");
  await evaluate(cdp, "window.__DAVE_QA__.setSourceFrame(99)");
  const deterministicB = await capture(cdp, "history-b.png");
  const historyDifference = countDifferentPixels(
    await readFile(deterministicA),
    await readFile(deterministicB),
  );
  if (historyDifference !== 0) {
    throw new Error(`Reflection output depends on render history (${historyDifference} pixels).`);
  }

  await evaluate(cdp, "window.__DAVE_QA__.setBraidVisible(false)");
  const noBraid = await capture(cdp, "dependency-no-braid.png");
  await evaluate(cdp, "window.__DAVE_QA__.setBraidVisible(true); window.__DAVE_QA__.setFrameVisible(false)");
  const noFrame = await capture(cdp, "dependency-no-frame.png");
  await evaluate(cdp, "window.__DAVE_QA__.setFrameVisible(true)");

  for (const [name, width, height] of [["portrait", 390, 844], ["landscape", 1440, 900]]) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(cdp, "window.dispatchEvent(new Event('resize')); window.__DAVE_QA__.setSourceFrame(99)");
    await capture(cdp, `layout-${name}.png`);
  }
  const webglContextLosses = await evaluate(cdp, "window.__daveContextLosses || 0");
  if (pageErrors.length > 0 || webglContextLosses > 0) {
    throw new Error(`Page/WebGL exceptions: ${pageErrors.join(" | ")}`);
  }

  const report = {
    output,
    anchors: metrics,
    mean: {
      fullMae: metrics.reduce((sum, row) => sum + row.full.mae, 0) / metrics.length,
      fullRmse: metrics.reduce((sum, row) => sum + row.full.rmse, 0) / metrics.length,
      cubeMae: metrics.reduce((sum, row) => sum + row.cube.mae, 0) / metrics.length,
      cubeRmse: metrics.reduce((sum, row) => sum + row.cube.rmse, 0) / metrics.length,
      centerMae: metrics.reduce((sum, row) => sum + row.center.mae, 0) / metrics.length,
      centerRmse: metrics.reduce((sum, row) => sum + row.center.rmse, 0) / metrics.length,
    },
    structural: {
      exactSourceTimesAndAngles: true,
      groundedContact: true,
      mirrorCount: 6,
      renderHistoryDifferentPixels: historyDifference,
      braidDependencyCapture: noBraid,
      frameDependencyCapture: noFrame,
      pageErrors,
      webglContextLosses,
    },
    states,
  };
  await writeFile(join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  cdp?.close();
  if (chrome && !chrome.killed) chrome.kill("SIGTERM");
  if (!vite.killed) vite.kill("SIGTERM");
  await rm(chromeProfile, { recursive: true, force: true });
}
