require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const compression = require('compression');
const fs = require('fs');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
        }
    }
});

// Gzip everything compressible. The demonstrator pages are large single-file
// bundles (SolCat ~400KB, the 100% Club ~2.7MB) and the 3D vendor payload adds
// more, so this is the single cheapest win available to the whole site.
app.use(compression());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Access gate ──────────────────────────────────
// Everything is password-protected except the StaffNet demonstrators.
const GATE_PASSWORD = 'HelloData#3!';
const GATE_COOKIE = 'd3access';
const GATE_TOKEN = require('crypto').createHash('sha256').update(GATE_PASSWORD + '|d3-agent-governance').digest('hex');
const OPEN_PATHS = new Set([
    '/sid', '/100club', '/sil', '/gate', '/favicon.ico',
    '/staffnet-intelligent-directory.html', '/staffnet-intelligence-final.html',
    '/staffnet-hero.png', '/prism-lens-system.png', '/security-in-mining-cover.png',
    '/mining-security-briefing.mp3', '/mining-data-ai-briefing.mp3', '/sid-bilby.png'
    /* /solcat is deliberately NOT here — the Practice Solution Prism sits behind the access phrase. */
]);

function hasAccess(req) {
    return (req.headers.cookie || '').split(';').some(c => {
        const [k, v] = c.trim().split('=');
        return k === GATE_COOKIE && v === GATE_TOKEN;
    });
}

function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function gatePage(next, failed) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Data#3 · Restricted</title><style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",Inter,Arial,sans-serif;background:linear-gradient(135deg,#071b2f,#0b2d4c 60%,#0f5268);color:#142235}
.box{background:#fff;border-radius:16px;padding:32px 34px;width:min(380px,calc(100vw - 40px));box-shadow:0 22px 70px rgba(0,0,0,.4)}
h1{font-size:20px;margin:0 0 6px;letter-spacing:-.4px}
p{margin:0 0 18px;color:#5b6b81;font-size:14px;line-height:1.5}
input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #dbe4ee;border-radius:9px;font:inherit;margin-bottom:12px}
button{width:100%;border:0;background:#0878d1;color:#fff;border-radius:9px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
button:hover{filter:brightness(1.08)}
.err{color:#b42b3c;font-size:13px;margin:0 0 12px}
</style></head><body><form class="box" method="post" action="/gate">
<h1>Restricted area</h1><p>This site is for internal demonstration. Enter the access phrase to continue.</p>
${failed ? '<p class="err">That was not the phrase. Try again.</p>' : ''}
<input type="password" name="password" placeholder="Access phrase" autofocus autocomplete="current-password" aria-label="Access phrase">
<input type="hidden" name="next" value="${escapeAttr(next)}">
<button type="submit">Enter</button>
</form></body></html>`;
}

app.post('/gate', (req, res) => {
    const next = typeof req.body.next === 'string' && req.body.next.startsWith('/') && !req.body.next.startsWith('//') ? req.body.next : '/';
    if ((req.body.password || '') === GATE_PASSWORD) {
        res.setHeader('Set-Cookie', `${GATE_COOKIE}=${GATE_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
        return res.redirect(next);
    }
    res.status(401).send(gatePage(next, true));
});

app.use((req, res, next) => {
    if (OPEN_PATHS.has(req.path) || hasAccess(req)) return next();
    if (req.method === 'GET' || req.method === 'HEAD') return res.status(401).send(gatePage(req.originalUrl));
    return res.status(401).json({ error: 'Authentication required' });
});

// Private AI practice pipeline view. It is intentionally absent from every
// navigation surface and can be assigned a different deployment path without
// changing the page or exposing that path in client-side markup.
const configuredPrivatePulsePath = process.env.PRIVATE_AI_PULSE_PATH || '/p/ai-ops-7f3c9';
const PRIVATE_AI_PULSE_PATH = /^\/[A-Za-z0-9/_-]{6,}$/.test(configuredPrivatePulsePath) &&
    !configuredPrivatePulsePath.startsWith('//') &&
    !['/gate', '/nav', '/world', '/ar', '/solcat'].includes(configuredPrivatePulsePath)
    ? configuredPrivatePulsePath
    : '/p/ai-ops-7f3c9';

app.get(PRIVATE_AI_PULSE_PATH, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.sendFile(path.join(__dirname, 'nav', 'practice-pulse', 'index.html'));
});

app.get(`${PRIVATE_AI_PULSE_PATH}/film-bible`, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.sendFile(path.join(__dirname, 'nav', 'practice-pulse', 'film-bible', 'index.html'));
});

// Do not expose a guessable static HTML URL for the private view. Its assets
// remain available only after the global password gate has granted access.
app.get([
    '/nav/practice-pulse', '/nav/practice-pulse/', '/nav/practice-pulse/index.html',
    '/nav/practice-pulse/film-bible', '/nav/practice-pulse/film-bible/', '/nav/practice-pulse/film-bible/index.html'
], (req, res) => {
    res.status(404).send('Not found');
});

// Serve static files from current directory.
// HTML is served with no-store: a response caught mid-deploy (zip extraction
// briefly exposes half-written files) must never be cached by the browser.
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        const privatePulseRoot = path.join(__dirname, 'nav', 'practice-pulse') + path.sep;
        if (filePath.endsWith('.html') || filePath.startsWith(privatePulseRoot)) {
            res.setHeader('Cache-Control', 'no-store');
        }
        if (filePath.startsWith(privatePulseRoot)) {
            res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } };

// Azure AI Foundry configuration
const AI_PROJECT_ENDPOINT = process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT;
const AGENT_ID = process.env.AZURE_EXISTING_AGENT_ID;
const SCOPE = 'https://ai.azure.com/.default';

// L2-Prometheus Agent configuration (Foundry Agent Service chatbot)
// Can be configured via environment variables or uses default endpoint
const PROMETHEUS_PROJECT_ENDPOINT = process.env.PROMETHEUS_PROJECT_ENDPOINT || process.env.AZURE_EXISTING_AIPROJECT_ENDPOINT;
const PROMETHEUS_AGENT_NAME = process.env.PROMETHEUS_AGENT_NAME || 'L2-Prometheus';
const PROMETHEUS_API_VERSION = process.env.PROMETHEUS_API_VERSION || '2025-11-15-preview';

// Initialize Azure credential (uses managed identity in Azure, or local credentials for dev)
let credential;
try {
    credential = new DefaultAzureCredential();
} catch (err) {
    console.warn('Azure credential initialization warning:', err.message);
}

// Agent chat API endpoint
app.post('/api/agent-chat', async (req, res) => {
    try {
        const { input, threadId, contextSource, uiContext, additionalContext } = req.body;

        if (!input) {
            return res.status(400).json({ error: "Missing 'input' field" });
        }

        // Build context-enriched input for the agent
        let enrichedInput = input;

        // Add page context to help the agent understand where the user is
        if (contextSource || uiContext) {
            const contextParts = [];

            if (contextSource && contextSource !== 'auto') {
                contextParts.push(`[Context Source: ${contextSource}]`);
            }

            if (uiContext) {
                contextParts.push(`[User is on: ${uiContext}]`);
            }

            if (additionalContext) {
                contextParts.push(`[Additional context: ${additionalContext}]`);
            }

            if (contextParts.length > 0) {
                enrichedInput = `${contextParts.join(' ')}\n\nUser question: ${input}`;
            }
        }

        console.log('[DEBUG] Context received:', { contextSource, uiContext, additionalContext });

        if (!AI_PROJECT_ENDPOINT || !AGENT_ID) {
            console.error('Missing Azure AI configuration. Check AZURE_EXISTING_AIPROJECT_ENDPOINT and AZURE_EXISTING_AGENT_ID environment variables.');
            return res.status(500).json({
                error: 'Agent not configured',
                reply: 'The AI assistant is not configured yet. Please check the server configuration.'
            });
        }

        if (!credential) {
            return res.status(500).json({
                error: 'Azure credentials not available',
                reply: 'Unable to authenticate with Azure. Please check server configuration.'
            });
        }

        // Get access token for Azure AI
        console.log('[DEBUG] Step 1: Getting Azure token...');
        let tokenResponse;
        try {
            tokenResponse = await credential.getToken(SCOPE);
            console.log('[DEBUG] Step 1: Token obtained successfully');
        } catch (tokenErr) {
            console.error('[DEBUG] Step 1 FAILED: Token error:', tokenErr.message);
            throw tokenErr;
        }

        // Build the Responses API URL
        const responsesUrl = `${AI_PROJECT_ENDPOINT}/applications/${AGENT_ID.split(':')[0]}/protocols/openai/responses?api-version=2025-11-15-preview`;
        console.log('[DEBUG] Step 2: Calling URL:', responsesUrl);

        // Call the Azure AI Foundry Responses API
        console.log('[DEBUG] Step 3: Making fetch request...');
        console.log('[DEBUG] Enriched input:', enrichedInput.substring(0, 200) + (enrichedInput.length > 200 ? '...' : ''));
        const response = await fetch(responsesUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenResponse.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: enrichedInput,
                // Include thread_id for conversation continuity if provided
                ...(threadId && { thread_id: threadId })
            }),
        });

        console.log('[DEBUG] Step 3: Fetch completed, status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DEBUG] Azure AI Foundry error:', response.status, errorText);
            return res.status(500).json({
                error: 'Error from Azure AI Foundry',
                status: response.status,
                details: errorText,
                reply: 'Sorry, I encountered an error while processing your request. Please try again.'
            });
        }

        console.log('[DEBUG] Step 4: Parsing JSON response...');
        const data = await response.json();
        console.log('[DEBUG] Step 4: Response parsed, keys:', Object.keys(data));

        // Extract the reply text from various possible response formats
        let replyText = data.output_text ||
                       data.output?.[0]?.content?.[0]?.text ||
                       data.choices?.[0]?.message?.content ||
                       data.result ||
                       (typeof data === 'string' ? data : null);

        if (!replyText && data.output) {
            // Try to extract text from output array
            for (const item of data.output) {
                if (item.type === 'message' && item.content) {
                    for (const content of item.content) {
                        if (content.type === 'output_text' || content.type === 'text') {
                            replyText = content.text;
                            break;
                        }
                    }
                }
                if (replyText) break;
            }
        }

        res.json({
            reply: replyText || 'I received your message but could not generate a response.',
            threadId: data.thread_id || threadId
        });

    } catch (err) {
        console.error('=== Agent chat error ===');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        if (err.cause) {
            console.error('Error cause:', err.cause);
        }
        res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            reply: 'Sorry, something went wrong. Please try again later.'
        });
    }
});

// Health check endpoint for debugging
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        config: {
            aiProjectEndpoint: AI_PROJECT_ENDPOINT ? 'configured' : 'missing',
            agentId: AGENT_ID ? AGENT_ID : 'missing',
            credentialInitialized: credential ? true : false
        }
    };

    // Test credential if requested
    if (req.query.testAuth === 'true' && credential) {
        try {
            console.log('[HEALTH] Testing Azure token acquisition...');
            const tokenResponse = await credential.getToken(SCOPE);
            health.authTest = {
                success: true,
                tokenExpiry: tokenResponse.expiresOnTimestamp
            };
            console.log('[HEALTH] Token test successful');
        } catch (err) {
            health.authTest = {
                success: false,
                error: err.message
            };
            console.error('[HEALTH] Token test failed:', err.message);
        }
    }

    res.json(health);
});

// Deployment diagnostics: reports what is actually on this app's disk so a
// truncated or stale file can be spotted without shell access to the host.
app.get('/api/diag', (req, res) => {
    const crypto = require('crypto');
    const files = [
        'index.html', 'staffnet-intelligent-directory.html', 'staffnet-solution-prism.html',
        'staffnet-intelligence-final.html', 'nav/index.html', 'nav/bubbles/d3.v7.min.js', 'server.js'
    ];
    const report = {};
    files.forEach(name => {
        const full = path.join(__dirname, name);
        try {
            const buf = fs.readFileSync(full);
            report[name] = {
                bytes: buf.length,
                sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16),
                endsWithCloseHtml: /<\/html>\s*$/i.test(buf.toString('utf8').slice(-200))
            };
        } catch (err) {
            report[name] = { error: err.message };
        }
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ at: new Date().toISOString(), node: process.version, dirname: __dirname, files: report });
});

// Helper function to extract text from uploaded files
async function extractTextFromFile(file) {
    const mimeType = file.mimetype;
    const buffer = file.buffer;

    if (mimeType === 'text/plain') {
        return buffer.toString('utf-8');
    }

    if (mimeType === 'application/pdf') {
        try {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text;
        } catch (err) {
            console.error('PDF parsing error:', err.message);
            return `[PDF file: ${file.originalname} - could not extract text]`;
        }
    }

    if (mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For Word docs, return a placeholder - full extraction would require mammoth.js
        return `[Word document: ${file.originalname} - Content uploaded for analysis]`;
    }

    return `[File: ${file.originalname}]`;
}

// L2-Prometheus Agent chat API endpoint (Foundry Agent Service)
app.post('/api/prometheus-chat', upload.array('files', 5), async (req, res) => {
    try {
        const { input, threadId } = req.body;
        const files = req.files || [];

        if (!input && files.length === 0) {
            return res.status(400).json({ error: "Missing 'input' field or files" });
        }

        // Build the message with file context
        let enrichedInput = input || '';

        if (files.length > 0) {
            const fileContents = await Promise.all(files.map(async (file) => {
                const text = await extractTextFromFile(file);
                return `\n\n--- File: ${file.originalname} ---\n${text}\n--- End of ${file.originalname} ---`;
            }));

            enrichedInput = `${enrichedInput}\n\n[Attached Files Context]${fileContents.join('')}`;
        }

        console.log('[PROMETHEUS] Processing request with', files.length, 'files');

        if (!PROMETHEUS_PROJECT_ENDPOINT) {
            console.error('[PROMETHEUS] Missing endpoint configuration. Set PROMETHEUS_PROJECT_ENDPOINT or AZURE_EXISTING_AIPROJECT_ENDPOINT.');
            return res.status(500).json({
                error: 'Prometheus Agent not configured',
                reply: 'The Prometheus Agent is not configured yet. Please check the server configuration (PROMETHEUS_PROJECT_ENDPOINT or AZURE_EXISTING_AIPROJECT_ENDPOINT environment variable).'
            });
        }

        if (!credential) {
            return res.status(500).json({
                error: 'Azure credentials not available',
                reply: 'Unable to authenticate with Azure. Please check server configuration.'
            });
        }

        // Get access token for Azure AI
        console.log('[PROMETHEUS] Getting Azure token...');
        let tokenResponse;
        try {
            tokenResponse = await credential.getToken(SCOPE);
            console.log('[PROMETHEUS] Token obtained successfully');
        } catch (tokenErr) {
            console.error('[PROMETHEUS] Token error:', tokenErr.message);
            throw tokenErr;
        }

        // Build the Prometheus Responses API URL dynamically
        const prometheusUrl = `${PROMETHEUS_PROJECT_ENDPOINT}/applications/${PROMETHEUS_AGENT_NAME}/protocols/openai/responses?api-version=${PROMETHEUS_API_VERSION}`;

        // Call the L2-Prometheus Responses API
        console.log('[PROMETHEUS] Calling API:', prometheusUrl);
        const response = await fetch(prometheusUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenResponse.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: enrichedInput,
                ...(threadId && { thread_id: threadId })
            }),
        });

        console.log('[PROMETHEUS] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PROMETHEUS] API error:', response.status, errorText);
            return res.status(500).json({
                error: 'Error from Prometheus Agent',
                status: response.status,
                details: errorText,
                reply: 'Sorry, I encountered an error while processing your request. Please try again.'
            });
        }

        const data = await response.json();
        console.log('[PROMETHEUS] Response received, keys:', Object.keys(data));

        // Extract the reply text from various possible response formats
        let replyText = data.output_text ||
                       data.output?.[0]?.content?.[0]?.text ||
                       data.choices?.[0]?.message?.content ||
                       data.result ||
                       (typeof data === 'string' ? data : null);

        if (!replyText && data.output) {
            for (const item of data.output) {
                if (item.type === 'message' && item.content) {
                    for (const content of item.content) {
                        if (content.type === 'output_text' || content.type === 'text') {
                            replyText = content.text;
                            break;
                        }
                    }
                }
                if (replyText) break;
            }
        }

        res.json({
            reply: replyText || 'I received your message but could not generate a response.',
            threadId: data.thread_id || threadId
        });

    } catch (err) {
        console.error('=== Prometheus chat error ===');
        console.error('Error:', err.message);
        res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            reply: 'Sorry, something went wrong. Please try again later.'
        });
    }
});

// Handle root route explicitly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), NO_STORE);
});

// Serve Stripe bundle explicitly
app.get('/stripe', (req, res) => {
    res.sendFile(path.join(__dirname, 'stripe.html'), NO_STORE);
});

// StaffNet Intelligent Directory (SID) — interactive demonstrator
app.get('/sid', (req, res) => {
    res.sendFile(path.join(__dirname, 'staffnet-intelligent-directory.html'), NO_STORE);
});

// Practice Solution Prism — practice, lens, solution and industry catalogue
app.get('/solcat', (req, res) => {
    res.sendFile(path.join(__dirname, 'staffnet-solution-prism.html'), NO_STORE);
});

// 100% Club — narrated StaffNet experience prototype (formerly /sil)
app.get('/100club', (req, res) => {
    res.sendFile(path.join(__dirname, 'staffnet-intelligence-final.html'), NO_STORE);
});

// Legacy shortcut: /sil now redirects to the 100% Club prototype
app.get('/sil', (req, res) => {
    res.redirect(301, '/100club');
});

// Portfolio World — the immersive 3D view of the portfolio taxonomy
app.get('/world', (req, res) => {
    res.sendFile(path.join(__dirname, 'nav', 'world', 'index.html'), NO_STORE);
});

// Portfolio AR — the same constellation as a phone magic window
app.get('/ar', (req, res) => {
    res.sendFile(path.join(__dirname, 'nav', 'ar', 'index.html'), NO_STORE);
});

// Fallback: serve index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), NO_STORE);
});

// When required as a module (the Vercel mirror wraps this app in a
// serverless function), export the app without binding a port.
if (require.main === module) app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('=== Azure AI Configuration ===');
    console.log('AZURE_EXISTING_AIPROJECT_ENDPOINT:', AI_PROJECT_ENDPOINT ? AI_PROJECT_ENDPOINT : '(not set)');
    console.log('AZURE_EXISTING_AGENT_ID:', AGENT_ID ? AGENT_ID : '(not set)');
    console.log('Azure credential initialized:', credential ? 'Yes' : 'No');
    if (AI_PROJECT_ENDPOINT && AGENT_ID) {
        console.log(`AI Agent configured: ${AGENT_ID}`);
    } else {
        console.log('AI Agent not configured - set AZURE_EXISTING_AIPROJECT_ENDPOINT and AZURE_EXISTING_AGENT_ID');
    }
    console.log('=== Prometheus Agent Configuration ===');
    console.log('PROMETHEUS_PROJECT_ENDPOINT:', PROMETHEUS_PROJECT_ENDPOINT ? PROMETHEUS_PROJECT_ENDPOINT : '(not set)');
    console.log('PROMETHEUS_AGENT_NAME:', PROMETHEUS_AGENT_NAME);
    if (PROMETHEUS_PROJECT_ENDPOINT) {
        console.log(`Prometheus Agent URL: ${PROMETHEUS_PROJECT_ENDPOINT}/applications/${PROMETHEUS_AGENT_NAME}/...`);
    } else {
        console.log('Prometheus Agent not configured - set PROMETHEUS_PROJECT_ENDPOINT or AZURE_EXISTING_AIPROJECT_ENDPOINT');
    }
});

module.exports = app;
