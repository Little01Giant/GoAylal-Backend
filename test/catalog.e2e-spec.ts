import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { DestinationsService } from '../src/modules/destinations/destinations.service.js';
import { Attraction, type AttractionDocument } from '../src/modules/destinations/schemas/attraction.schema.js';
import { Hotel, type HotelDocument } from '../src/modules/destinations/schemas/hotel.schema.js';
import { Transport, type TransportDocument } from '../src/modules/destinations/schemas/transport.schema.js';
import { makeCity } from './helpers/catalog-fixture.js';
import { createTestApp, type TestContext } from './helpers/test-app.js';

describe('Catalog: database-only cities, idempotent upsert and public contract', () => {
  let ctx: TestContext;
  let service: DestinationsService;
  let attractions: Model<AttractionDocument>;
  let hotels: Model<HotelDocument>;
  let transports: Model<TransportDocument>;
  const city = makeCity('beijing', 'Бээжин', 12);

  beforeAll(async () => {
    ctx = await createTestApp();
    service = ctx.app.get(DestinationsService);
    attractions = ctx.app.get(getModelToken(Attraction.name));
    hotels = ctx.app.get(getModelToken(Hotel.name));
    transports = ctx.app.get(getModelToken(Transport.name));
  });
  afterAll(async () => ctx.close());

  it('serves nothing from code: an empty database has no cities, trips or fallback', async () => {
    expect(await attractions.countDocuments()).toBe(0);
    expect((await ctx.http.get('/api/v1/destinations').expect(200)).body.data).toEqual([]);
    expect((await ctx.http.get('/api/v1/destinations/suggested-trips').expect(200)).body.data).toEqual([]);
    await ctx.http.get('/api/v1/destinations/beijing').expect(404);
  });

  it('upserts a city once, then re-upserting changes nothing: same rows, same _ids', async () => {
    await service.upsertCity(city);
    const idsAfterFirst = (await attractions.find().sort({ seedId: 1 }).lean()).map((a) => a._id.toString());
    expect(idsAfterFirst).toHaveLength(city.attractions.length);
    expect(await hotels.countDocuments()).toBe(city.hotels.length);
    expect(await transports.countDocuments()).toBe(city.transports.length);

    await service.upsertCity(city);
    await service.upsertCity(city);
    const idsAfterThird = (await attractions.find().sort({ seedId: 1 }).lean()).map((a) => a._id.toString());
    expect(idsAfterThird).toEqual(idsAfterFirst);
    expect(await hotels.countDocuments()).toBe(city.hotels.length);
  });

  it('adopts rows written by the old delete-and-reinsert seed instead of duplicating them', async () => {
    await attractions.deleteMany({});
    const legacy = city.attractions[0]!;
    const destination = await ctx.app.get<Model<{ _id: unknown }>>(getModelToken('Destination')).findOne({ key: city.key });
    const inserted = await attractions.collection.insertOne({
      destinationId: destination?._id,
      destinationKey: city.key,
      name: legacy.name,
      description: 'old',
      category: legacy.category,
      region: 'old',
      imageUrl: 'old.jpg',
      estimatedCost: 1,
    });

    await service.upsertCity(city);
    expect(await attractions.countDocuments()).toBe(city.attractions.length);
    const adopted = await attractions.findById(inserted.insertedId).lean();
    expect(adopted?.seedId).toBe(legacy.id);
    expect(adopted?.estimatedCost).toBe(legacy.estimatedCost);
  });

  it('GET /destinations/:key returns the full catalog without dropping hotels or transports', async () => {
    const res = await ctx.http.get(`/api/v1/destinations/${city.key}`).expect(200);
    const data = res.body.data;
    expect(data.attractions).toHaveLength(city.attractions.length);
    expect(data.hotels.map((h: { starRating: number }) => h.starRating).sort()).toEqual([2, 3, 5]);
    expect(data.transports).toHaveLength(city.transports.length);
    expect(data.attractions[0]).toMatchObject({ id: expect.any(String), estimatedCost: expect.any(Number) });
  });

  it('stores the Trip.com price source in the database but never returns it from the public API', async () => {
    const seeded = city.attractions[0]!;
    const row = await attractions.findOne({ destinationKey: city.key, seedId: seeded.id }).lean();
    expect(row?.sourceUrl).toBe(seeded.sourceUrl);
    expect(row?.priceCheckedAt).toBe(seeded.priceCheckedAt);

    const res = await ctx.http.get(`/api/v1/destinations/${city.key}`).expect(200);
    const everything = JSON.stringify(res.body);
    expect(everything).not.toContain('sourceUrl');
    expect(everything).not.toContain('priceCheckedAt');
    const list = JSON.stringify((await ctx.http.get('/api/v1/destinations').expect(200)).body);
    expect(list).not.toContain('sourceUrl');
    expect(list).not.toContain('priceCheckedAt');
  });

  it('lists destinations and 404s on an unknown key', async () => {
    const list = await ctx.http.get('/api/v1/destinations').expect(200);
    expect(list.body.data.map((d: { key: string }) => d.key)).toContain(city.key);
    const missing = await ctx.http.get('/api/v1/destinations/atlantis').expect(404);
    expect(missing.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
  });
});
