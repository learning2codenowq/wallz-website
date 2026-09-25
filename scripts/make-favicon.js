/* ═══════════════════════════════════════════════
   WALLZ — FAVICON GENERATOR
   Builds the favicon set from the main logo: white wordmark
   centred on a black square.

   Usage: npm run favicon
   ═══════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const LOGO = path.join(ROOT, 'assets', 'logos', 'main logo wallz updated.svg');
const OUT = path.join(ROOT, 'assets', 'favicon');

/* How much of the square's width the wordmark fills */
const LOGO_WIDTH_RATIO = 0.7;

async function run() {
  /* Recolour every filled path white (the source letters are multicoloured) */
  const white = fs.readFileSync(LOGO, 'utf8').replace(/fill:#[0-9a-f]{3,6}/gi, 'fill:#fff');

  /* Find the wordmark's real bounds inside its oversized canvas */
  const render = await sharp(Buffer.from(white)).png().toBuffer();
  const trimmed = await sharp(render).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const x = -trimmed.info.trimOffsetLeft;
  const y = -trimmed.info.trimOffsetTop;
  const w = trimmed.info.width;
  const h = trimmed.info.height;

  /* Square viewBox centred on the wordmark, with a black backdrop */
  const size = Math.round(w / LOGO_WIDTH_RATIO);
  const vx = Math.round(x + w / 2 - size / 2);
  const vy = Math.round(y + h / 2 - size / 2);
  const inner = white.slice(white.indexOf('<g>'), white.lastIndexOf('</svg>'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${size} ${size}" ` +
    `style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">` +
    `<rect x="${vx}" y="${vy}" width="${size}" height="${size}" fill="#000"/>` +
    inner +
    `</svg>`;

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), svg);

  const pngs = { 'favicon-32.png': 32, 'favicon-48.png': 48, 'apple-touch-icon.png': 180, 'icon-512.png': 512 };
  for (const [name, px] of Object.entries(pngs)) {
    await sharp(Buffer.from(svg), { density: 300 }).resize(px, px).png().toFile(path.join(OUT, name));
  }

  /* favicon.ico at the site root for browsers that request it directly.
     An ICO can wrap a PNG as-is: 6-byte header + 16-byte directory entry. */
  const png = fs.readFileSync(path.join(OUT, 'favicon-48.png'));
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: icon
  header.writeUInt16LE(1, 4);          // image count
  header.writeUInt8(48, 6);            // width
  header.writeUInt8(48, 7);            // height
  header.writeUInt16LE(1, 10);         // colour planes
  header.writeUInt16LE(32, 12);        // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);        // image data offset
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([header, png]));

  console.log('Favicons written to assets/favicon/ and favicon.ico');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
