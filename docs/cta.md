# /cta — badge capture at the stand

**`https://data3-cisco-live.vercel.app/cta`** is the visitor page: a handheld "field unit" on their phone. Power on camera → hold their badge QR in the little screen → IDENTITY ACQUIRED and the decoded dossier → optional note → TRANSMIT → INFORMATION CAPTURED with a reference code. A manual name/email form covers refused cameras.

**`/cta/admin`** (admin key, same key as the Decision Room): live list of captures, **Export CSV**, delete, and **Print booth QR** — an A4 page with the QR that opens `/cta`.

## Data

Stored in the site's Neon Postgres in `cta_captures` (created on first use): the raw QR payload, the parsed fields, note, device, time. Parsing is best-effort because the badge format is not known in advance: vCard, URL (query fields), JSON, or a plain / delimited ID string (`12345^Jane Citizen^Acme^jane@acme.com`). The raw payload is always kept, so a different badge format loses nothing; add a parser case when this year's badge is in hand.

## API

- `POST /api/cta/captures` `{ payload, note?, manual? }` → `{ code, parsed }` (public)
- `GET /api/cta/captures`, `GET /api/cta/captures.csv`, `DELETE /api/cta/captures/:id` (header `x-admin-key`)

## Testing without a badge

`scripts` are not needed: in Chromium, override `navigator.mediaDevices.getUserMedia` to return a canvas `captureStream()` painting a QR image. The session's e2e used a vCard and a delimited ID badge; both decode via jsQR (BarcodeDetector is used when the browser has it).
