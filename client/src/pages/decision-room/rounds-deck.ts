/**
 * Round-by-round report as a two-slide PowerPoint, drawn in the "When the Agent
 * Attacks" deck's style (navy, aqua kickers, outlined cards, Arial). Slide 1 is
 * every round's question with each table's vote, confidence and reason; slide 2
 * is the summary with the facilitator's notes. Built in the browser from the same
 * model the on-screen two-page report renders, so the deck and the page agree.
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
  tiles: { big: string; small: string }[];
  finish: { name: string; matches: string | null; choices: string; standout: string; standoutGood: boolean | null }[];
  notes: string; footnote: string;
};

const NAVY = "000025", CARD = "0A1B3A", EDGE = "1E3A5F", ACCENT = "00AEFF", KICK = "78DCFF", BODY = "D5E1F0", MUTED = "9FB3CC", WHITE = "FFFFFF", AMBER = "F59E0B";
const FONT = "Arial";
const W = 13.333, X0 = 0.667, X1 = 12.667;

function clip(text: string, max: number) { return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text; }

export async function downloadRoundsDeck(model: RoundsModel) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in, same as the source deck
  pptx.title = `${model.title} · Room ${model.roomCode}`;

  const header = (slide: ReturnType<typeof pptx.addSlide>, kicker: string, title: string, page: string) => {
    slide.background = { color: NAVY };
    slide.addText(kicker, { x: X0, y: 0.26, w: 10.5, h: 0.3, fontFace: FONT, fontSize: 11, bold: true, color: KICK, margin: 0 });
    slide.addText(title, { x: X0, y: 0.55, w: 10.8, h: 0.55, fontFace: FONT, fontSize: 26, bold: true, color: WHITE, margin: 0, fit: "shrink" });
    slide.addShape("rect", { x: X0, y: 1.15, w: X1 - X0, h: 0.012, fill: { color: EDGE }, line: { color: EDGE, width: 0 } });
    slide.addText([{ text: "Data", options: {} }, { text: "#", options: { superscript: true } }, { text: "3", options: {} }],
      { x: 11.55, y: 0.3, w: 1.1, h: 0.42, fontFace: FONT, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle", fill: { color: "007BC3" }, margin: 0 });
    slide.addText(page, { x: W - 1.2, y: 7.0, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 11, color: MUTED, align: "right", margin: 0 });
  };
  const chip = (slide: ReturnType<typeof pptx.addSlide>, x: number, y: number, d: number, letter: string, best: boolean, none = false) => {
    slide.addText(none ? "–" : letter, {
      shape: "ellipse", x, y, w: d, h: d, fontFace: FONT, fontSize: d > 0.25 ? 13 : 1, bold: true, align: "center", valign: "middle", margin: 0,
      color: none ? MUTED : best ? NAVY : KICK, fill: { color: best ? ACCENT : NAVY }, line: { color: none ? EDGE : ACCENT, width: 1.75 },
    });
  };

  // ---------------------------------------------------------------- slide 1
  const s1 = pptx.addSlide();
  header(s1, `${model.kicker} · ROOM ${model.roomCode} · ${model.dateLabel.toUpperCase()}`, "Round by round: the question, and how each table answered", "01");
  const n = Math.max(1, model.tables.length);
  const QW = n > 6 ? 2.6 : 3.05;
  const colW = (X1 - X0 - QW) / n;
  const narrow = colW < 1.6;
  s1.addText(model.conditional ? "ROUND · QUESTION · CONDITIONAL PREFERENCE" : "ROUND · QUESTION · RICHARD'S BEST MOVE", { x: X0 + 0.08, y: 1.24, w: QW, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: KICK, margin: 0 });
  model.tables.forEach((name, i) => s1.addText(name.toUpperCase(), { x: X0 + QW + i * colW + 0.1, y: 1.24, w: colW - 0.12, h: 0.25, fontFace: FONT, fontSize: narrow ? 7 : 9, bold: true, color: KICK, margin: 0, fit: "shrink" }));
  const avail = 6.85 - 1.5;
  const emptyH = 0.62, gap = 0.05;
  const filled = model.rows.filter((r) => !r.empty).length;
  const rowH = Math.min(0.95, (avail - (model.rows.length - filled) * emptyH - model.rows.length * gap) / Math.max(1, filled));
  const chipD = Math.min(0.32, rowH * 0.36, colW * 0.24);
  let y = 1.5;
  for (const row of model.rows) {
    const h = row.empty ? emptyH : rowH;
    s1.addShape("rect", { x: X0, y, w: X1 - X0, h, fill: { color: CARD }, line: { color: EDGE, width: 1 } });
    const left: { text: string; options: Record<string, unknown> }[] = [
      { text: `${row.label.toUpperCase()}${row.seat ? ` · ${row.seat.toUpperCase()}` : ""}`, options: { fontSize: 8.5, bold: true, color: KICK, breakLine: true } },
      { text: row.question, options: { fontSize: 11, bold: true, color: WHITE, breakLine: true } },
    ];
    if (row.guide) left.push({ text: row.guide, options: { fontSize: 8.5, color: BODY, breakLine: true } });
    if (!row.empty) left.push({ text: row.call, options: { fontSize: 8.5, bold: true, color: row.callMatches ? ACCENT : MUTED } });
    s1.addText(left, { x: X0 + 0.08, y: y + 0.03, w: QW - 0.1, h: h - 0.06, fontFace: FONT, valign: "middle", margin: 0, fit: "shrink" });
    if (row.empty) {
      s1.addText(row.empty, { x: X0 + QW + 0.1, y, w: X1 - X0 - QW - 0.2, h, fontFace: FONT, fontSize: 9.5, italic: true, color: MUTED, valign: "middle", margin: 0 });
    } else {
      row.cells.forEach((cell, i) => {
        const cx = X0 + QW + i * colW;
        s1.addShape("rect", { x: cx, y: y + 0.1, w: 0.012, h: h - 0.2, fill: { color: EDGE }, line: { color: EDGE, width: 0 } });
        chip(s1, cx + 0.08, y + 0.1, chipD, cell?.option ?? "", !model.conditional && !!cell?.best, !cell);
        if (cell?.confidence) s1.addText(`${cell.confidence}/5`, { x: cx + 0.06, y: y + 0.12 + chipD, w: 0.45, h: 0.2, fontFace: FONT, fontSize: 7.5, color: MUTED, margin: 0 });
        const tx = cx + Math.max(chipD + 0.14, 0.46);
        const text = cell ? (cell.rationale ? `“${clip(cell.rationale, narrow ? 90 : 180)}”` : "No reason written") : "Did not lock";
        s1.addText(text, { x: tx, y: y + 0.04, w: cx + colW - tx - 0.05, h: h - 0.08, fontFace: FONT, fontSize: narrow ? 7 : cell && cell.rationale.length > 120 ? 8 : 8.5, italic: true, color: cell?.rationale ? BODY : MUTED, valign: "middle", margin: 0, fit: "shrink" });
      });
    }
    y += h + gap;
  }
  const ly = 6.95;
  if (!model.conditional) {
    chip(s1, 0.75, ly + 0.04, 0.2, "", true);
    s1.addText("Matches Richard's best move", { x: 1.0, y: ly, w: 2.6, h: 0.28, fontFace: FONT, fontSize: 9, color: MUTED, valign: "middle", margin: 0 });
    chip(s1, 3.35, ly + 0.04, 0.2, "", false);
    s1.addText("Another option", { x: 3.6, y: ly, w: 2.2, h: 0.28, fontFace: FONT, fontSize: 9, color: MUTED, valign: "middle", margin: 0 });
  }
  s1.addText("Locked vote, confidence and reason from each table's device. Reasons are verbatim.", { x: model.conditional ? X0 : 5.2, y: ly, w: 6.6, h: 0.28, fontFace: FONT, fontSize: 9, color: MUTED, valign: "middle", margin: 0 });

  // ---------------------------------------------------------------- slide 2
  const s2 = pptx.addSlide();
  header(s2, `SUMMARY · ROOM ${model.roomCode} · ${model.tables.length} TABLES`, "What the decisions tell us, and how it went", "02");
  const tx0 = X0, tw = 3.55;
  let ty = 1.4;
  for (const t of model.tiles.slice(0, 3)) {
    s2.addShape("rect", { x: tx0, y: ty, w: tw, h: 0.82, fill: { color: CARD }, line: { color: EDGE, width: 1 } });
    s2.addText(t.big, { x: tx0 + 0.15, y: ty + 0.06, w: tw - 0.3, h: 0.45, fontFace: FONT, fontSize: t.big.length < 10 ? 22 : 18, bold: true, color: ACCENT, margin: 0, fit: "shrink" });
    s2.addText(t.small, { x: tx0 + 0.15, y: ty + 0.5, w: tw - 0.3, h: 0.28, fontFace: FONT, fontSize: 10, color: BODY, margin: 0 });
    ty += 0.92;
  }
  s2.addText("WHERE EACH TABLE FINISHED", { x: tx0, y: ty + 0.02, w: tw, h: 0.28, fontFace: FONT, fontSize: 9.5, bold: true, color: KICK, margin: 0 });
  ty += 0.32;
  const fh = Math.min(0.41, (6.85 - ty) / Math.max(1, model.finish.length) - 0.06);
  model.finish.forEach((f, i) => {
    const fy = ty + i * (fh + 0.06);
    s2.addShape("rect", { x: tx0, y: fy, w: tw, h: fh, fill: { color: CARD }, line: { color: EDGE, width: 1 } });
    s2.addText(f.name, { x: tx0 + 0.1, y: fy, w: 1.4, h: fh, fontFace: FONT, fontSize: 10, bold: true, color: WHITE, valign: "middle", margin: 0, fit: "shrink" });
    if (f.matches) s2.addText(f.matches, { x: tx0 + 1.42, y: fy, w: 0.8, h: fh, fontFace: FONT, fontSize: 9, color: BODY, valign: "middle", margin: 0 });
    s2.addText(f.standout, { x: tx0 + 2.1, y: fy, w: 1.42, h: fh, fontFace: FONT, fontSize: 8.5, color: f.standoutGood === false ? AMBER : KICK, align: "right", valign: "middle", margin: 0, fit: "shrink" });
  });

  const px = 4.45, pw = 4.35;
  s2.addText("THE ROOM'S CALL, ROUND BY ROUND", { x: px, y: 1.32, w: pw, h: 0.28, fontFace: FONT, fontSize: 9.5, bold: true, color: KICK, margin: 0 });
  const stepH = Math.min(0.92, 5.3 / Math.max(1, model.rows.length));
  model.rows.forEach((row, i) => {
    const ry = 1.65 + i * stepH;
    s2.addText(String(i + 1).padStart(2, "0"), { x: px, y: ry, w: 0.45, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: ACCENT, margin: 0 });
    s2.addText([
      { text: `${row.label}: ${row.question}`, options: { fontSize: 11.5, bold: true, color: WHITE, breakLine: true } },
      { text: row.empty ? row.empty : [row.call, row.guide].filter(Boolean).join(" · "), options: { fontSize: 9.5, color: row.empty ? MUTED : BODY } },
    ], { x: px + 0.48, y: ry, w: pw - 0.5, h: stepH - 0.05, fontFace: FONT, valign: "top", margin: 0, fit: "shrink" });
  });

  const ox = 9.0, ow = 3.667;
  s2.addShape("rect", { x: ox, y: 1.4, w: ow, h: 5.42, fill: { color: CARD }, line: { color: ACCENT, width: 2.25 } });
  s2.addText("FACILITATOR NOTES · HOW IT WENT", { x: ox + 0.2, y: 1.55, w: ow - 0.4, h: 0.28, fontFace: FONT, fontSize: 9.5, bold: true, color: KICK, margin: 0 });
  const lines = model.notes.split(/\n+/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  s2.addText(lines.length ? lines.map((l) => ({ text: l, options: { bullet: { indent: 12 }, breakLine: true, paraSpaceAfter: 6 } })) : [{ text: "Add your notes on the report page before downloading.", options: { italic: true, color: MUTED } }],
    { x: ox + 0.2, y: 1.9, w: ow - 0.4, h: 4.8, fontFace: FONT, fontSize: 10.5, color: BODY, valign: "top", margin: 0, fit: "shrink" });
  s2.addText(model.footnote, { x: X0, y: 6.92, w: 11.2, h: 0.3, fontFace: FONT, fontSize: 8.5, color: MUTED, margin: 0 });

  await pptx.writeFile({ fileName: `decision-room-${model.roomCode}-round-by-round.pptx` });
}
