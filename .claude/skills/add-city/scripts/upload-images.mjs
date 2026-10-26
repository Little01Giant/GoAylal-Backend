/**
 * Uploads staged WebP images to the Cloudflare R2 bucket from .env.
 *
 *   node upload-images.mjs <stagingDir> [--dry-run]
 *
 * <stagingDir>/<code>-att-NN/{1,2,3}.webp  ->  attractions/<code>-att-NN/{n}.webp
 * Never overwrites: keys that already exist are skipped (so a city can't clobber another city's photos).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const require = createRequire(path.join(root, 'package.json'));
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const dir = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!dir) throw new Error('usage: node upload-images.mjs <stagingDir> [--dry-run]');

const e = process.env;
for (const k of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME']) {
  if (!e[k]) throw new Error(`${k} is not set in .env`);
}
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${e.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: e.CLOUDFLARE_R2_ACCESS_KEY_ID, secretAccessKey: e.CLOUDFLARE_R2_SECRET_ACCESS_KEY },
});

let uploaded = 0;
let skipped = 0;
for (const id of fs.readdirSync(dir).filter((d) => /^[a-z]{2,3}-att-\d\d$/.test(d)).sort()) {
  for (const f of fs.readdirSync(path.join(dir, id)).filter((x) => /^\d\.webp$/.test(x)).sort()) {
    const Key = `attractions/${id}/${f}`;
    let exists = true;
    try { await s3.send(new HeadObjectCommand({ Bucket: e.CLOUDFLARE_R2_BUCKET_NAME, Key })); } catch { exists = false; }
    if (exists) { console.log('exists, skipped:', Key); skipped++; continue; }
    if (!dryRun) {
      await s3.send(new PutObjectCommand({
        Bucket: e.CLOUDFLARE_R2_BUCKET_NAME,
        Key,
        Body: fs.readFileSync(path.join(dir, id, f)),
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }));
    }
    uploaded++;
  }
}
console.log(`${dryRun ? 'would upload' : 'uploaded'} ${uploaded}, skipped ${skipped}`);
