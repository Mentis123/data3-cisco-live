// Mounts the Data#3 practice platform (the d3-agent-governance site) under
// /practice without touching the Cisco Live app at the root. The practice
// tree is a verbatim copy of that repository, whose pages reference their
// assets by absolute root paths (/nav/..., /sid, /gate). Express strips the
// /practice prefix on the way in; the patches below add it back on the way
// out — in redirects and in every text response body — so the site works
// unchanged under the sub-path.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const BASE = '/practice';

// Root-absolute references that belong to the practice site: its route
// words, its top-level directories, and root-level asset files. The
// look-ahead keeps the delimiter, so replacement only inserts the prefix.
const ROUTE_WORDS = '(?:nav|box|assets|api|gate|sid|solcat|governance|pulse|oa|world|world-reference|conductor|ar|p)';
const ROOT_FILE = '[A-Za-z0-9_.-]+\\.(?:png|jpe?g|gif|svg|glb|mp3|mp4|css|js|mjs|html|md|txt|json|csv|psv|pdf|ico)';
const ABSOLUTE_REF = new RegExp(
  `(["'\`=(,\\s])\\/(?=${ROUTE_WORDS}(?:\\/|["'\`?#\\s)])|(?=${ROOT_FILE}(?:["'\`?#\\s)])))`,
  'g'
);

const TEXT_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.css', '.json', '.md', '.txt', '.csv', '.psv', '.svg']);

function rewriteBody(body) {
  return String(body)
    .replace(ABSOLUTE_REF, `$1${BASE}/`)
    // A bare "/" home link in markup. Attribute forms only — a "/" string
    // inside JavaScript (path splitting and the like) must stay untouched.
    .replace(/(href|action)="\/"/g, `$1="${BASE}/"`);
}

function isTextResponse(res) {
  const type = String(res.get('Content-Type') || '');
  return /html|javascript|css|json|svg|csv|text/i.test(type);
}

// The vendored three.js builds are megabytes of minified code with no
// root-absolute references of their own; serving them untouched avoids
// both the regex cost and any risk of corrupting them.
function skipRewrite(filePath) {
  return filePath.includes(`${path.sep}nav${path.sep}vendor${path.sep}`);
}

// Patch order matters: these base patches load BEFORE the practice site's
// own preloads, so the preloads' enhancement layers wrap them and every
// body they emit still flows through the prefix rewrite underneath.
const baseSend = express.response.send;
express.response.send = function send(body) {
  // A string body with no Content-Type yet (express only sets text/html
  // inside send itself — after this patch runs) is markup from a route
  // handler, e.g. the password-gate page; rewrite those too.
  if (typeof body === 'string' && (isTextResponse(this) || !this.get('Content-Type'))) {
    return baseSend.call(this, rewriteBody(body));
  }
  return baseSend.call(this, body);
};

const baseSendFile = express.response.sendFile;
express.response.sendFile = function sendFile(filePath, options, callback) {
  const ext = path.extname(String(filePath)).toLowerCase();
  if (TEXT_EXT.has(ext) && !skipRewrite(String(filePath))) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const headers = (options && options.headers) || {};
      Object.entries(headers).forEach(([name, value]) => this.set(name, value));
      if (!this.get('Content-Type')) this.type(ext);
      this.send(rewriteBody(content));
      if (typeof callback === 'function') callback();
      return this;
    } catch (error) {
      /* Fall through to the original streaming implementation. */
    }
  }
  return baseSendFile.call(this, filePath, options, callback);
};

// express.static streams files without touching res.send/res.sendFile, so
// text assets it serves need their own rewrite path. Binary files and the
// vendored three.js builds still stream through the real static handler.
const realStatic = express.static.bind(express);
const patchedStatic = function (root, options) {
  const fallback = realStatic(root, options);
  return function practiceStatic(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return fallback(req, res, next);
    const requestPath = decodeURIComponent(req.path.endsWith('/') ? `${req.path}index.html` : req.path);
    const ext = path.extname(requestPath).toLowerCase();
    if (!TEXT_EXT.has(ext) || requestPath.includes('/nav/vendor/')) return fallback(req, res, next);
    const filePath = path.normalize(path.join(root, requestPath));
    if (!filePath.startsWith(path.normalize(root + path.sep))) return fallback(req, res, next);
    let content;
    try {
      if (!fs.statSync(filePath).isFile()) return fallback(req, res, next);
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return fallback(req, res, next);
    }
    if (options && typeof options.setHeaders === 'function') options.setHeaders(res, filePath);
    res.type(ext);
    return res.send(rewriteBody(content));
  };
};
patchedStatic.mime = realStatic.mime;
express.static = patchedStatic;

const baseRedirect = express.response.redirect;
express.response.redirect = function redirect(...args) {
  const last = args.length - 1;
  const target = args[last];
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.startsWith(BASE)) {
    args[last] = BASE + target;
  }
  return baseRedirect.apply(this, args);
};

// The site's own enhancement preloads (SID terminology layer, SolCat
// mobile chrome) — loaded after the base patches, exactly as `node -r`
// loads them before server.js on Azure.
require('../practice/taxonomy-preload.js');
require('../practice/solcat-record-preload.js');

const inner = require('../practice/server.js');

const outer = express();
outer.use(BASE, inner);
// Anything reaching this function without the prefix (misrouted probes)
// goes to the practice landing page rather than a hang.
outer.use((req, res) => res.redirect(BASE + '/'));

export default outer;
