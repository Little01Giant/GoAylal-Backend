import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: 'D:/travel-backend/.env' });

const {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_PUBLIC_URL // e.g. https://pub-xxxxxx.r2.dev or https://cdn.goaylal.mn
} = process.env;

const baseDir = 'D:/Travel project/public/images/attractions';

async function main() {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_BUCKET_NAME) {
    console.error(`
[Cloudflare R2 Configuration Required]
Please add the following variables to D:/travel-backend/.env:

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev (or https://cdn.yourdomain.com)
`);
    process.exit(1);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`Connecting to Cloudflare R2 bucket "${CLOUDFLARE_R2_BUCKET_NAME}"...`);

  let uploadedCount = 0;
  for (let i = 1; i <= 20; i++) {
    const id = 'bj-att-' + String(i).padStart(2, '0');
    const dir = path.join(baseDir, id);
    if (!fs.existsSync(dir)) continue;

    for (let n = 1; n <= 3; n++) {
      const fileName = `${n}.webp`;
      const filePath = path.join(dir, fileName);
      if (!fs.existsSync(filePath)) continue;

      const fileBuffer = fs.readFileSync(filePath);
      const key = `attractions/${id}/${fileName}`;

      console.log(`Uploading ${key} (${fileBuffer.length} bytes)...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: CLOUDFLARE_R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      uploadedCount++;
    }
  }

  console.log(`\nSuccessfully uploaded ${uploadedCount} WebP images to Cloudflare R2!`);
  if (CLOUDFLARE_R2_PUBLIC_URL) {
    console.log(`Public CDN Base URL: ${CLOUDFLARE_R2_PUBLIC_URL}/attractions/...`);
  }
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
