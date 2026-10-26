/**
 * Downloads attraction gallery photos from Trip.com (ak-d.tripcdn.com) into the staging layout.
 *
 *   node fetch-trip-images.mjs <plan.json> <stagingDir>
 *
 * plan: { "hn-att-01": ["<image id>", ...up to 3], ... }
 * An image id is the part of a gallery <img> URL between `/images/` and `_W_`
 * (https://ak-d.tripcdn.com/images/<id>_W_960_0_R5_Q50.webp). Collect them from each attraction page with the
 * snippet in SKILL.md step 3. Output: <stagingDir>/<id>/{1..n}.webp (1280px WebP).
 * Look at the result (contact sheet) and drop promo banners / images with overlaid text before uploading.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(root, 'package.json'))('sharp');

const [planFile, outDir] = process.argv.slice(2);
if (!planFile || !outDir) throw new Error('usage: node fetch-trip-images.mjs <plan.json> <stagingDir>');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const UA = { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.trip.com/' };

for (const [id, imageIds] of Object.entries(plan)) {
  const dir = path.join(outDir, id);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const imageId of imageIds) {
    for (const size of ['1280_0_R5_Q80', '960_0_R5_Q50']) {
      const res = await fetch(`https://ak-d.tripcdn.com/images/${imageId}_W_${size}.webp?proc=source/trip`, { headers: UA });
      if (!res.ok) continue;
      const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      n++;
      fs.writeFileSync(path.join(dir, `${n}.webp`), buf);
      break;
    }
  }
  console.log(`${id}: ${n} image(s)`);
}
