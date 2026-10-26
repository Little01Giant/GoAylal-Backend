/**
 * Validates a city spec and upserts it into the database (cities live only in the database, not in code).
 * Needs `npm run build` first: it boots the built app and calls DestinationsService.upsertCity.
 *
 *   node insert-city.mjs <spec.json> [--images <stagingDir>] [--dry-run]
 *
 * Spec (see ../reference/city-spec.example.json): city fields + code + attractions[] + hotels[3] + transports[].
 * Builds ids (<code>-att-NN, hotel-<code>-level-N, tr-<code>-<type>) and R2 image URLs.
 * Every attraction, hotel and transport must carry `sourceUrl` (the Trip.com page its price came from);
 * `priceCheckedAt` defaults to the spec-level value or today.
 * With --images, each attraction's `images` array follows the files actually present in
 * <stagingDir>/<code>-att-NN/ (so no URL points at a missing file); otherwise imageCount (default 3) is used.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const require = createRequire(path.join(root, 'package.json'));
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const specFile = args.find((a) => !a.startsWith('--') && a !== flag('--images'));
const imagesDir = flag('--images');
const dryRun = args.includes('--dry-run');
if (!specFile) throw new Error('usage: node insert-city.mjs <spec.json> [--images dir] [--dry-run]');

const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const CATEGORIES = ['nature', 'historical', 'cultural', 'adventure', 'city', 'culinary'];
const TRANSPORT_TYPES = ['flight', 'overland', 'combined'];
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const today = new Date().toISOString().slice(0, 10);
const TRIP_URL = /^https:\/\/([a-z]+\.)?trip\.com\/\S+$/;
/** Every price must record the Trip.com page it came from so it can be refreshed later. */
const source = (label, item) => {
  check(TRIP_URL.test(item.sourceUrl ?? ''), `${label}: sourceUrl must be the Trip.com page the price was read from`);
  const checked = item.priceCheckedAt ?? spec.priceCheckedAt ?? today;
  check(/^\d{4}-\d{2}-\d{2}$/.test(checked), `${label}: priceCheckedAt must be YYYY-MM-DD`);
  return { sourceUrl: item.sourceUrl, priceCheckedAt: checked };
};

for (const f of ['key', 'code', 'name', 'country', 'countryKey', 'flag', 'tag', 'description']) check(spec[f], `missing ${f}`);
check(/^[a-z]{2,3}$/.test(spec.code ?? ''), 'code must be 2-3 lowercase letters (e.g. ph)');
check(/^[a-z-]+$/.test(spec.key ?? ''), 'key must be lowercase kebab-case');

const r2Base = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').replace(/\/$/, '');
check(r2Base, 'CLOUDFLARE_R2_PUBLIC_URL is not set in .env');

const attractions = (spec.attractions ?? []).map((a) => {
  const id = `${spec.code}-att-${String(a.n).padStart(2, '0')}`;
  let count = a.imageCount ?? 3;
  if (imagesDir) {
    const dir = path.join(imagesDir, id);
    count = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^\d\.webp$/.test(f)).length : 0;
    check(count > 0, `${id}: no images in ${dir}`);
  }
  const images = Array.from({ length: count }, (_, i) => `${r2Base}/attractions/${id}/${i + 1}.webp`);
  check(CATEGORIES.includes(a.category), `${id}: bad category ${a.category}`);
  check(Number.isInteger(a.estimatedCost) && a.estimatedCost >= 0, `${id}: estimatedCost must be integer MNT >= 0 (free = 0)`);
  check(a.estimatedHours > 0, `${id}: estimatedHours must be > 0`);
  check(a.rating >= 0 && a.rating <= 5, `${id}: rating 0-5`);
  check(Array.isArray(a.highlights) && a.highlights.length >= 3, `${id}: need >= 3 highlights`);
  check(a.name && a.description && a.region, `${id}: name/description/region required`);
  return {
    rank: a.rank, id, name: a.name, nameEn: a.nameEn, category: a.category, region: a.region,
    estimatedCost: a.estimatedCost, estimatedHours: a.estimatedHours,
    imageUrl: images[0], images, rating: a.rating, highlights: a.highlights, description: a.description,
    ...source(id, a),
  };
});
check(attractions.length >= 10, 'need at least 10 attractions (the planner preselects the first 10 by rank)');
check(new Set(attractions.map((a) => a.id)).size === attractions.length, 'duplicate attraction n');
check(new Set(attractions.map((a) => a.rank)).size === attractions.length, 'duplicate rank');

const hotels = (spec.hotels ?? []).map((h, i) => {
  check(Number.isInteger(h.pricePerNight) && h.pricePerNight > 0, `hotel ${i + 1}: pricePerNight must be a positive integer MNT`);
  return { id: `hotel-${spec.code}-level-${i + 1}`, ...h, ...source(`hotel ${i + 1}`, h) };
});
check(hotels.map((h) => h.starRating).sort().join() === '2,3,5', 'hotels must be exactly the 2, 3 and 5 star tiers');

const transports = (spec.transports ?? []).map((t) => {
  check(TRANSPORT_TYPES.includes(t.type), `transport: bad type ${t.type}`);
  check(Number.isInteger(t.pricePerPerson) && t.pricePerPerson > 0, `transport ${t.type}: pricePerPerson must be a positive integer MNT`);
  return { id: `tr-${spec.code}-${t.type}`, ...t, ...source(`transport ${t.type}`, t) };
});
check(transports.length > 0, 'need at least one transport');
check(new Set(transports.map((t) => t.type)).size === transports.length, 'transport types must be unique per city');

if (errors.length) {
  console.error('Spec rejected:\n - ' + errors.join('\n - '));
  process.exit(1);
}

const city = {
  key: spec.key, name: spec.name, country: spec.country, countryKey: spec.countryKey, flag: spec.flag,
  tag: spec.tag, description: spec.description, attractions, hotels, transports,
};
if (dryRun) {
  console.log(`dry-run OK: ${spec.key} -> ${attractions.length} attractions, ${hotels.length} hotels, ${transports.length} transports`);
} else {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = await import(pathToFileURL(path.join(root, 'dist/app.module.js')).href);
  const { DestinationsService } = await import(pathToFileURL(path.join(root, 'dist/modules/destinations/destinations.service.js')).href);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  try {
    await app.get(DestinationsService).upsertCity(city);
    console.log(`upserted ${spec.key} into the database: ${attractions.length} attractions, ${hotels.length} hotels, ${transports.length} transports`);
  } finally {
    await app.close();
  }
}
