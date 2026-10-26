/**
 * Downloads licensed photos, converts them to 1280px WebP and records credits.
 *
 *   node fetch-images.mjs commons <plan.json> <stagingDir>
 *   node fetch-images.mjs pexels  <plan.json> <stagingDir>
 *
 * commons plan: { "ph-att-01": ["search query", maxImages, "title regex"] }
 *   Only CC BY / CC BY-SA / CC0 / public-domain landscape images >= 1000px are kept.
 * pexels plan:  { "ph-att-07": ["<slug-with-id from a pexels.com/photo/ URL>", ...] }
 * Output: <stagingDir>/<id>/{1..n}.webp and an appended <stagingDir>/credits.json
 * (id -> [{file,title,license,author,source}]). NEVER add Trip.com or other copyrighted photos here.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const sharp = createRequire(path.join(root, 'package.json'))('sharp');

const [mode, planFile, outDir] = process.argv.slice(2);
if (!['commons', 'pexels'].includes(mode) || !planFile || !outDir) {
  throw new Error('usage: node fetch-images.mjs commons|pexels <plan.json> <stagingDir>');
}
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const UA = { 'User-Agent': 'Mozilla/5.0 goaylal-image-fetch/1.0' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const creditsFile = path.join(outDir, 'credits.json');
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {};

async function save(id, n, res) {
  const dir = path.join(outDir, id);
  fs.mkdirSync(dir, { recursive: true });
  const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(path.join(dir, `${n}.webp`), buf);
  return Math.round(buf.length / 1024);
}

for (const [id, entry] of Object.entries(plan)) {
  credits[id] = [];
  let n = 0;
  if (mode === 'commons') {
    const [query, max = 3, titleRe = '.'] = entry;
    const api =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=30' +
      `&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600` +
      '&iiextmetadatafilter=LicenseShortName|Artist';
    const j = await (await fetch(api, { headers: UA })).json();
    const re = new RegExp(titleRe, 'i');
    const pages = Object.values(j.query?.pages ?? {})
      .sort((a, b) => a.index - b.index)
      .filter((p) => {
        const i = p.imageinfo?.[0];
        return i && i.width >= 1000 && i.width >= i.height && re.test(p.title) && !/panoramio/i.test(p.title) &&
          /^(CC BY|CC0|Public domain)/i.test(i.extmetadata?.LicenseShortName?.value ?? '');
      })
      .slice(0, max);
    for (const p of pages) {
      const i = p.imageinfo[0];
      const res = await fetch(i.thumburl, { headers: UA });
      if (!res.ok) continue;
      n++;
      const kb = await save(id, n, res);
      credits[id].push({
        file: `${n}.webp`, title: p.title.replace('File:', ''), license: i.extmetadata.LicenseShortName.value,
        author: (i.extmetadata.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(), source: i.descriptionurl, kb,
      });
      await sleep(400);
    }
  } else {
    for (const slug of entry) {
      const pid = slug.match(/(\d+)$/)?.[1];
      if (!pid) continue;
      const res = await fetch(`https://images.pexels.com/photos/${pid}/pexels-photo-${pid}.jpeg?auto=compress&cs=tinysrgb&w=1600`, { headers: UA });
      if (!res.ok) continue;
      n++;
      const kb = await save(id, n, res);
      credits[id].push({ file: `${n}.webp`, title: slug, license: 'Pexels License', author: '', source: `https://www.pexels.com/photo/${slug}/`, kb });
      await sleep(500);
    }
  }
  console.log(`${id}: ${n} image(s)`);
  for (const c of credits[id]) console.log(`   ${c.file} ${c.kb}KB | ${c.title.slice(0, 60)} | ${c.license}${c.author ? ' | ' + c.author.slice(0, 30) : ''}`);
}
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2));
