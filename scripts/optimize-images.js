/* ═══════════════════════════════════════════════
   WALLZ — IMAGE OPTIMIZER
   Converts PNG originals in assets/originals/<group>/<device>/N.png
   into web-ready WebP files in assets/images/<group>/.

   Usage:
     npm run images                      convert everything
     npm run images -- hero/desktop/1    only paths containing the filter(s)

   Folders starting with "_" (e.g. assets/originals/_old) are ignored,
   so replaced originals can be kept without being converted.
   ═══════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'originals');
const OUT = path.join(ROOT, 'assets', 'images');

/* Output widths per device. Desktop originals are 16:9, mobile are 9:16.
   The 1080px mobile file keeps the plain name (mobile-N.webp); every
   other size gets a -<width> suffix. */
const SIZES = {
  desktop: [2560, 1920],
  mobile: [1080]
};

const QUALITY = 80;

/* Images with text baked in need more pixels and less compression
   to stay crisp on high-density screens. Keyed by <group>/<device>/<name>. */
const OVERRIDES = {
  'hero/desktop/1': { widths: [3840, 2560, 1920], quality: 85 },
  'hero/mobile/1':  { widths: [1440, 1080], quality: 85 }
};

const filters = process.argv.slice(2);

async function run() {
  const groups = fs.readdirSync(SRC).filter(g => !g.startsWith('_') && fs.statSync(path.join(SRC, g)).isDirectory());
  let total = 0;

  for (const group of groups) {
    const outDir = path.join(OUT, group);
    fs.mkdirSync(outDir, { recursive: true });

    for (const device of Object.keys(SIZES)) {
      const dir = path.join(SRC, group, device);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f));

      for (const file of files) {
        const name = path.parse(file).name;
        const key = `${group}/${device}/${name}`;
        if (filters.length && !filters.some(f => key.includes(f))) continue;

        const opts = OVERRIDES[key] || {};
        const widths = opts.widths || SIZES[device];
        const quality = opts.quality || QUALITY;

        for (const width of widths) {
          const suffix = device === 'mobile' && width === 1080 ? '' : '-' + width;
          const outFile = path.join(outDir, `${device}-${name}${suffix}.webp`);

          await sharp(path.join(dir, file))
            .resize({ width, withoutEnlargement: true, kernel: 'lanczos3' })
            /* smartSubsample keeps full colour detail around sharp edges like text */
            .webp({ quality, effort: 6, smartSubsample: true })
            .toFile(outFile);

          const kb = Math.round(fs.statSync(outFile).size / 1024);
          total += kb;
          console.log(`${path.relative(ROOT, outFile)}  ${kb} KB`);
        }
      }
    }
  }

  console.log(`\nDone. ${total} KB total.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
