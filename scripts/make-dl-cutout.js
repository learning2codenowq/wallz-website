/* ═══════════════════════════════════════════════
   WALLZ — DESIGN LANGUAGE LOGO, SAMSUNG-SAFE VERSION
   The source logo draws "by" as white letters on top of a dark box.
   Samsung Internet's forced dark mode recolours those two shapes into one
   solid box. This builds a copy where the box and letters are ONE black
   path and the letters are holes (evenodd), so there is no colour left for
   Samsung to change. Looks identical once the site's invert filter is applied.

   Usage: node scripts/make-dl-cutout.js
   ═══════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'logos', 'designlanguagebywallz (1).svg');
const OUT = path.join(ROOT, 'assets', 'logos', 'designlanguagebywallz-cutout.svg');

const svg = fs.readFileSync(SRC, 'utf8');

/* The "by" box is the first rect; the "by" letters are the white paths */
const boxTag = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*\/>/);
const box = { x0: +boxTag[1], y0: +boxTag[2], x1: +boxTag[1] + +boxTag[3], y1: +boxTag[2] + +boxTag[4] };
const letterTags = svg.match(/<path d="[^"]*" style="fill:#fff;[^"]*"\/>/g);
if (!letterTags || letterTags.length !== 2) throw new Error('Expected 2 white "by" paths');

/* Straight-line paths only (M/L/H/V/Z, absolute or relative) → list of polygons */
function toPolygons(d) {
  const tokens = d.match(/[MmLlHhVvZz]|-?[\d.]+(?:e-?\d+)?/g);
  const polys = [];
  let poly = null, x = 0, y = 0, cmd = null, i = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    switch (cmd) {
      case 'M': x = num(); y = num(); poly = [[x, y]]; polys.push(poly); cmd = 'L'; break;
      case 'm': x += num(); y += num(); poly = [[x, y]]; polys.push(poly); cmd = 'l'; break;
      case 'L': x = num(); y = num(); poly.push([x, y]); break;
      case 'l': x += num(); y += num(); poly.push([x, y]); break;
      case 'H': x = num(); poly.push([x, y]); break;
      case 'h': x += num(); poly.push([x, y]); break;
      case 'V': y = num(); poly.push([x, y]); break;
      case 'v': y += num(); poly.push([x, y]); break;
      case 'Z': case 'z': if (poly) { x = poly[0][0]; y = poly[0][1]; } break;
      default: throw new Error('Unsupported path command: ' + cmd);
    }
  }
  return polys;
}

/* Sutherland–Hodgman clip against the (convex) box */
function clip(poly) {
  const edges = [
    [p => p[0] >= box.x0, (a, b) => lerpX(a, b, box.x0)],
    [p => p[0] <= box.x1, (a, b) => lerpX(a, b, box.x1)],
    [p => p[1] >= box.y0, (a, b) => lerpY(a, b, box.y0)],
    [p => p[1] <= box.y1, (a, b) => lerpY(a, b, box.y1)]
  ];
  let out = poly;
  for (const [inside, cut] of edges) {
    const input = out; out = [];
    for (let k = 0; k < input.length; k++) {
      const cur = input[k], prev = input[(k + input.length - 1) % input.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
function lerpX(a, b, x) { const t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + t * (b[1] - a[1])]; }
function lerpY(a, b, y) { const t = (y - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y]; }

const r = n => +n.toFixed(3);
const ring = pts => 'M' + pts.map(p => r(p[0]) + ',' + r(p[1])).join('L') + 'Z';

let d = ring([[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]]);
for (const tag of letterTags) {
  for (const poly of toPolygons(tag.match(/d="([^"]*)"/)[1])) {
    const clipped = clip(poly);
    if (clipped.length >= 3) d += ring(clipped);
  }
}

const out = svg
  .replace(boxTag[0], `<path d="${d}" style="fill:#000;fill-rule:evenodd;"/>`)
  .replace(/<path d="[^"]*" style="fill:#fff;[^"]*"\/>/g, '');

fs.writeFileSync(OUT, out);
console.log('Wrote', path.relative(ROOT, OUT));
