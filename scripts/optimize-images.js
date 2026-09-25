/* ═══════════════════════════════════════════════
   WALLZ — IMAGE OPTIMIZER
   Converts PNG originals in assets/originals/<group>/<device>/N.png
   into web-ready WebP files in assets/images/<group>/.

   Usage: npm run images
   ═══════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'originals');
const OUT = path.join(ROOT, 'assets', 'images');

/* Output widths per device. Desktop originals are 16:9, mobile are 9:16. */
const SIZES = {
  desktop: [2560, 1920],
  mobile: [1080]
};

const QUALITY = 80;

async function run() {
  const groups = fs.readdirSync(SRC).filter(g => fs.statSync(path.join(SRC, g)).isDirectory());
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

        for (const width of SIZES[device]) {
          const suffix = device === 'mobile' ? '' : '-' + width;
          const outFile = path.join(outDir, `${device}-${name}${suffix}.webp`);

          await sharp(path.join(dir, file))
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 6 })
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
