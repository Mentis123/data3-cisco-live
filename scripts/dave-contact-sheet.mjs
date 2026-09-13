// Builds the two review images referenced by docs/dave-evaluation.md from an
// evaluate-dave output directory:
//   implementation-contact-sheet.png   nine anchors, 3×3, 256 px each
//   reference-vs-implementation.png    source (left) vs render (right) for
//                                      frames 0009, 0039, 0099, 0219
// usage: node scripts/dave-contact-sheet.mjs <evaluate-output-dir> [dest-dir]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [source, destination = join(repo, "docs", "dave-reference")] = process.argv.slice(2);
if (!source) throw new Error("Pass the evaluate-dave output directory.");
mkdirSync(destination, { recursive: true });

const anchors = [9, 39, 69, 99, 129, 159, 189, 219, 240];
const name = (frame) => `frame-${String(frame).padStart(4, "0")}.png`;
const read = (path) => PNG.sync.read(readFileSync(path));

/** Box-filter downscale by an integer factor. */
function shrink(png, factor) {
  const out = new PNG({ width: png.width / factor, height: png.height / factor });
  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const sums = [0, 0, 0, 0];
      for (let dy = 0; dy < factor; dy += 1) {
        for (let dx = 0; dx < factor; dx += 1) {
          const offset = ((y * factor + dy) * png.width + (x * factor + dx)) * 4;
          for (let c = 0; c < 4; c += 1) sums[c] += png.data[offset + c];
        }
      }
      const offset = (y * out.width + x) * 4;
      for (let c = 0; c < 4; c += 1) out.data[offset + c] = Math.round(sums[c] / (factor * factor));
    }
  }
  return out;
}

function blit(target, png, x0, y0) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const from = (y * png.width + x) * 4;
      const to = ((y0 + y) * target.width + (x0 + x)) * 4;
      target.data[to] = png.data[from];
      target.data[to + 1] = png.data[from + 1];
      target.data[to + 2] = png.data[from + 2];
      target.data[to + 3] = 255;
    }
  }
}

// 3×3 contact sheet of the rendered anchors.
const sheet = new PNG({ width: 3 * 256 + 8, height: 3 * 256 + 8 });
sheet.data.fill(16);
anchors.forEach((frame, index) => {
  const tile = shrink(read(join(source, name(frame))), 2);
  blit(sheet, tile, 2 + (index % 3) * 258, 2 + Math.floor(index / 3) * 258);
});
writeFileSync(join(destination, "implementation-contact-sheet.png"), PNG.sync.write(sheet));

// Reference (left) vs render (right), four anchors stacked.
const pairs = [9, 39, 99, 219];
const compare = new PNG({ width: 2 * 512 + 8, height: pairs.length * 512 + 8 * (pairs.length - 1) });
compare.data.fill(16);
pairs.forEach((frame, index) => {
  blit(compare, read(join(repo, "docs", "dave-reference", name(frame))), 0, index * 520);
  blit(compare, read(join(source, name(frame))), 520, index * 520);
});
writeFileSync(join(destination, "reference-vs-implementation.png"), PNG.sync.write(compare));
console.log(`wrote implementation-contact-sheet.png and reference-vs-implementation.png to ${destination}`);
