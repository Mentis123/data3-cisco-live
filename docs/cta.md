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

## Hidden controls (staff cheat sheet)

1. **Phosphor dial**: drag or tap the brass wheel on the right edge to change the screen colour.
2. **AURA switch**: turns on an edge glow in the colour the camera sees.
3. **Antenna**: pull or tap it up for signal bars, a chirp and D#3 in Morse on the light.
4. **Status light**: tap it three times for night vision. Three more taps turn it off.
5. **Degauss**: press and hold the Data#3 logo for about a second. Shaking the phone also works where the browser allows motion without asking (most Android phones). On a laptop, press D.

A big SECRETS tally (five lights and a count) appears under the buttons once the first one is found. Find all five and the unit turns gold, and the capture gets a `GOLD-` reference. 

Triple-tap the Data#3 logo to reset the passport: secrets go back to 0/5 and the dial, AURA, antenna and night vision are switched off. Use it to hand a fresh unit to the next person.

The page is pinned while the unit is on screen, so dragging the controls can't scroll it or trigger pull-to-refresh.

## Staff panel

Three fingers on the screen (or a triple-click on a laptop) opens the staff panel. It asks for a password the first time on each device, then remembers it until you tap **Lock**.

- **Password**: the `CTA_STAFF_KEY` environment variable in Vercel. Any admin key (the facilitator key) also works. The staff password does **not** open `/cta/admin`.
- **Connect QR**: for the other person to scan.
- **Scanner mode**: Booth lead, Chris's session or Game feedback. The mode is remembered on the device, shown on the unit's footer plate, changes the note prompt, and is saved with every capture (the `mode` column in the admin list and the CSV).

Every capture also has an optional **Additional contact details** field (email, mobile, LinkedIn, anything). It's the `additional_contact` column in the CSV.
