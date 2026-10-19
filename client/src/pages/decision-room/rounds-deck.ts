/**
 * Round-by-round report as a one-slide PowerPoint, drawn in the "When the Agent
 * Attacks" deck's style (navy, aqua kickers, outlined cards, Arial): every
 * round's question with each table's vote, confidence and reason, then a band of
 * room-level rollups and observations. No table is scored or ranked. Built in the
 * browser from the same model the on-screen report renders, so they agree.
 *
 * Self-contained (no app imports) and mirrored byte-for-byte between the live
 * site and the fallback.
 */

export type RoundsCell = { option: string; confidence: number | null; rationale: string; best: boolean } | null;
export type RoundsRow = {
  label: string; seat: string; question: string;
  /** "Richard: C · Establish ground truth", or the conditional preference line, or null. */
  guide: string | null;
  call: string; callMatches: boolean;
  /** Set when no table locked a call: why the row is empty. */
  empty: string | null;
  cells: RoundsCell[];
};
export type RoundsModel = {
  kicker: string; title: string; roomCode: string; dateLabel: string; conditional: boolean;
  tables: string[]; rows: RoundsRow[];
  /** Room-level rollups only: never per table. */
  tiles: { big: string; small: string }[];
  observations: string[];
  footnote: string;
};

const NAVY = "000025", CARD = "0A1B3A", EDGE = "1E3A5F", ACCENT = "00AEFF", KICK = "78DCFF", BODY = "D5E1F0", MUTED = "9FB3CC", WHITE = "FFFFFF";
const FONT = "Arial";
const X0 = 0.667, X1 = 12.667;

function clip(text: string, max: number) { return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text; }

export async function downloadRoundsDeck(model: RoundsModel) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in, same as the source deck
  pptx.title = `${model.title} · Room ${model.roomCode}`;
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  s.addText(`${model.kicker} · ROOM ${model.roomCode} · ${model.dateLabel.toUpperCase()}`, { x: X0, y: 0.22, w: 10.5, h: 0.28, fontFace: FONT, fontSize: 10.5, bold: true, color: KICK, margin: 0 });
  s.addText("Round by round: the question, and how each table answered", { x: X0, y: 0.48, w: 10.8, h: 0.5, fontFace: FONT, fontSize: 24, bold: true, color: WHITE, margin: 0, fit: "shrink" });
  s.addShape("rect", { x: X0, y: 1.03, w: X1 - X0, h: 0.012, fill: { color: EDGE }, line: { color: EDGE, width: 0 } });
  s.addText([{ text: "Data", options: {} }, { text: "#", options: { superscript: true } }, { text: "3", options: {} }],
    { x: 11.55, y: 0.26, w: 1.1, h: 0.42, fontFace: FONT, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", fill: { color: "007BC3" }, margin: 0 });

  const chip = (x: number, y: number, d: number, letter: string, best: boolean, none = false) => {
    s.addText(none ? "–" : letter, {
      shape: "ellipse", x, y, w: d, h: d, fontFace: FONT, fontSize: d > 0.25 ? 12 : 1, bold: true, align: "center", valign: "middle", margin: 0,
      color: none ? MUTED : best ? NAVY : KICK, fill: { color: best ? ACCENT : NAVY }, line: { color: none ? EDGE : ACCENT, width: 1.5 },
    });
  };

  // Rounds grid
  const n = Math.max(1, model.tables.length);
  const QW = n > 6 ? 2.6 : 3.0;
  const colW = (X1 - X0 - QW) / n;
  const narrow = colW < 1.6;
  s.addText(model.conditional ? "ROUND · QUESTION · CONDITIONAL PREFERENCE" : "ROUND · QUESTION · RICHARD'S BEST MOVE", { x: X0 + 0.08, y: 1.1, w: QW, h: 0.22, fontFace: FONT, fontSize: 8.5, bold: true, color: KICK, margin: 0 });
  model.tables.forEach((name, i) => s.addText(name.toUpperCase(), { x: X0 + QW + i * colW + 0.1, y: 1.1, w: colW - 0.12, h: 0.22, fontFace: FONT, fontSize: narrow ? 7 : 8.5, bold: true, color: KICK, margin: 0, fit: "shrink" }));
  const top = 1.36, bottom = 5.62, gap = 0.04, emptyH = 0.44;
  const filled = model.rows.filter((r) => !r.empty).length;
  const rowH = Math.min(0.85, (bottom - top - (model.rows.length - filled) * emptyH - model.rows.length * gap) / Math.max(1, filled));
  const chipD = Math.min(0.28, rowH * 0.4, colW * 0.22);
  let y = top;
  for (const row of model.rows) {
    const h = row.empty ? emptyH : rowH;
    s.addShape("rect", { x: X0, y, w: X1 - X0, h, fill: { color: CARD }, line: { color: EDGE, width: 1 } });
    const left: { text: string; options: Record<string, unknown> }[] = row.empty
      ? [{ text: `${row.label.toUpperCase()}${row.seat ? ` · ${row.seat.toUpperCase()}` : ""}  `, options: { fontSize: 8, bold: true, color: KICK } },
        { text: row.question, options: { fontSize: 10, bold: true, color: WHITE } }]
      : [{ text: `${row.label.toUpperCase()}${row.seat ? ` · ${row.seat.toUpperCase()}` : ""}`, options: { fontSize: 8, bold: true, color: KICK, breakLine: true } },
        { text: row.question, options: { fontSize: 10.5, bold: true, color: WHITE, breakLine: true } },
        ...(row.guide ? [{ text: row.guide, options: { fontSize: 8, color: BODY, breakLine: true } }] : []),
        { text: row.call, options: { fontSize: 8, bold: true, color: row.callMatches ? ACCENT : MUTED } }];
    s.addText(left, { x: X0 + 0.08, y: y + 0.02, w: QW - 0.1, h: h - 0.04, fontFace: FONT, valign: "middle", margin: 0, fit: "shrink" });
    if (row.empty) {
      s.addText(row.guide ? `${row.empty} ${row.guide}.` : row.empty, { x: X0 + QW + 0.1, y, w: X1 - X0 - QW - 0.2, h, fontFace: FONT, fontSize: 9, italic: true, color: MUTED, valign: "middle", margin: 0 });
    } else {
      row.cells.forEach((cell, i) => {
        const cx = X0 + QW + i * colW;
        s.addShape("rect", { x: cx, y: y + 0.08, w: 0.012, h: h - 0.16, fill: { color: EDGE }, line: { color: EDGE, width: 0 } });
        chip(cx + 0.08, y + 0.08, chipD, cell?.option ?? "", !model.conditional && !!cell?.best, !cell);
        if (cell?.confidence) s.addText(`${cell.confidence}/5`, { x: cx + 0.05, y: y + 0.1 + chipD, w: 0.42, h: 0.18, fontFace: FONT, fontSize: 7, color: MUTED, margin: 0 });
        const tx = cx + Math.max(chipD + 0.14, 0.44);
        const text = cell ? (cell.rationale ? `“${clip(cell.rationale, narrow ? 90 : 170)}”` : "No reason written") : "Did not lock";
        s.addText(text, { x: tx, y: y + 0.03, w: cx + colW - tx - 0.05, h: h - 0.06, fontFace: FONT, fontSize: narrow ? 7 : cell && cell.rationale.length > 110 ? 7.5 : 8, italic: true, color: cell?.rationale ? BODY : MUTED, valign: "middle", margin: 0, fit: "shrink" });
      });
    }
    y += h + gap;
  }

  // Rollups and observations
  const by = 5.74, bh = 1.32;
  const tw = 4.1;
  const tiles = model.tiles.slice(0, 4);
  const tileW = (tw - 0.08 * (tiles.length - 1)) / Math.max(1, Math.ceil(tiles.length / 2));
  tiles.forEach((t, i) => {
    const col = i % 2, line = Math.floor(i / 2);
    const x = X0 + col * (tileW + 0.08), ty = by + line * (bh / 2 + 0.02);
    s.addShape("rect", { x, y: ty, w: tileW, h: bh / 2 - 0.02, fill: { color: CARD }, line: { color: EDGE, width: 1 } });
    s.addText([{ text: t.big, options: { fontSize: t.big.length > 12 ? 12 : 15, bold: true, color: ACCENT, breakLine: true } }, { text: t.small, options: { fontSize: 8, color: BODY } }],
      { x: x + 0.1, y: ty + 0.03, w: tileW - 0.16, h: bh / 2 - 0.08, fontFace: FONT, valign: "middle", margin: 0, fit: "shrink" });
  });
  const ox = X0 + tw + 0.15, ow = X1 - ox;
  s.addShape("rect", { x: ox, y: by, w: ow, h: bh, fill: { color: CARD }, line: { color: ACCENT, width: 1.75 } });
  s.addText("WHAT WE OBSERVED", { x: ox + 0.15, y: by + 0.06, w: 3, h: 0.2, fontFace: FONT, fontSize: 8.5, bold: true, color: KICK, margin: 0 });
  const obs = model.observations.slice(0, 6);
  const half = Math.ceil(obs.length / 2);
  const colOW = (ow - 0.4) / 2;
  [obs.slice(0, half), obs.slice(half)].forEach((list, c) => {
    if (!list.length) return;
    s.addText(list.map((o) => ({ text: o, options: { bullet: { indent: 10 }, breakLine: true, paraSpaceAfter: 3 } })),
      { x: ox + 0.15 + c * (colOW + 0.1), y: by + 0.28, w: colOW, h: bh - 0.34, fontFace: FONT, fontSize: 8.5, color: BODY, valign: "top", margin: 0, fit: "shrink" });
  });

  const legend = model.conditional ? "" : "Filled circle: matches Richard's best move. ";
  s.addText(`${legend}Locked vote, confidence and verbatim reason from each table's device. ${model.footnote}`, { x: X0, y: 7.1, w: X1 - X0 - 0.5, h: 0.24, fontFace: FONT, fontSize: 7.5, color: MUTED, margin: 0, fit: "shrink" });

  await pptx.writeFile({ fileName: `decision-room-${model.roomCode}-round-by-round.pptx` });
}
