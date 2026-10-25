import { AdminService } from '../src/modules/admin/admin.service.js';
import { UserRole } from '../src/modules/auth/schemas/user.schema.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

const IMG = 'https://img.example.test/attractions/xx-att-01/1.webp';

function attraction(rank: number, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `xx-att-${String(rank).padStart(2, '0')}`,
    rank,
    name: `Үзвэр ${rank}`,
    category: 'city',
    region: 'Test, City',
    estimatedCost: rank * 1000,
    estimatedHours: 2,
    imageUrl: IMG,
    rating: 4.5,
    highlights: ['a', 'b', 'c', 'd'],
    description: 'Тайлбар',
    ...over,
  };
}

function city(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Туршилтын хот',
    country: 'Хятад',
    countryKey: 'china',
    flag: '🇨🇳',
    tag: 'Туршилт',
    attractions: [attraction(3), attraction(1), attraction(2)],
    hotels: [
      { id: 'hotel-xx-level-1', name: 'Хямд буудал', starRating: 2, pricePerNight: 100000, imageUrl: IMG, locationDesc: 'Төв', amenities: ['Wi-Fi'] },
    ],
    transports: [
      { id: 'tr-xx-flight', type: 'flight', title: 'Дан нислэг', durationText: '3 цаг', pricePerPerson: 1000000 },
    ],
    ...over,
  };
}

describe('Admin destinations: add and edit a city in the database', () => {
  let ctx: TestContext;
  let admin: TestUser;
  let member: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
    member = await ctx.makeUser('member@example.test');
  });
  afterAll(async () => ctx.close());

  const as = (user: TestUser): { Authorization: string } => bearer(user.token);
  const put = (key: string, body: unknown, user: TestUser = admin) =>
    ctx.http.put(`/api/v1/admin/destinations/${key}`).set(as(user)).send(body as object);

  it('rejects anonymous and non-admin callers', async () => {
    await ctx.http.put('/api/v1/admin/destinations/xx').send(city()).expect(401);
    await put('xx', city(), member).expect(403);
    await ctx.http.get('/api/v1/admin/destinations').set(as(member)).expect(403);
  });

  it('creates a city that the public API serves, attractions ordered by rank', async () => {
    const res = await put('test-city', city()).expect(200);
    expect(res.body.data).toEqual({ key: 'test-city', attractions: 3, hotels: 1, transports: 1 });

    const pub = (await ctx.http.get('/api/v1/destinations/test-city').expect(200)).body.data;
    expect(pub).toMatchObject({ key: 'test-city', name: 'Туршилтын хот', countryKey: 'china' });
    expect(pub.attractions.map((a: { rank: number }) => a.rank)).toEqual([1, 2, 3]);
    expect(pub.hotels).toHaveLength(1);
    expect(pub.transports[0]).toMatchObject({ type: 'flight', pricePerPerson: 1000000 });

    const list = (await ctx.http.get('/api/v1/destinations').expect(200)).body.data as { key: string }[];
    expect(list.map((d) => d.key)).toContain('test-city');
  });

  it('editing is idempotent: same rows and _ids, changed fields updated, unlisted rows kept', async () => {
    const before = (await ctx.http.get('/api/v1/destinations/test-city')).body.data.attractions as { id: string; name: string }[];
    await put('test-city', city({ attractions: [attraction(1, { name: 'Шинэ нэр', estimatedCost: 5 })] })).expect(200);
    const after = (await ctx.http.get('/api/v1/destinations/test-city')).body.data.attractions as {
      id: string;
      name: string;
      estimatedCost: number;
    }[];
    expect(after).toHaveLength(3);
    expect(after.map((a) => a.id)).toEqual(before.map((a) => a.id));
    expect(after[0]).toMatchObject({ name: 'Шинэ нэр', estimatedCost: 5 });
  });

  it('lists catalog cities with counts', async () => {
    const list = (await ctx.http.get('/api/v1/admin/destinations').set(as(admin)).expect(200)).body.data as {
      key: string;
      attractions: number;
    }[];
    expect(list.find((d) => d.key === 'test-city')).toMatchObject({ attractions: 3, hotels: 1, transports: 1 });
  });

  it('validates the body and the key', async () => {
    await put('Bad Key', city()).expect(400);
    await put('test-city', city({ attractions: [] })).expect(400);
    await put('test-city', city({ attractions: [attraction(1, { category: 'unknown' })] })).expect(400);
    await put('test-city', city({ attractions: [attraction(1, { imageUrl: 'javascript:alert(1)' })] })).expect(400);
    await put('test-city', city({ attractions: [attraction(1), attraction(1)] })).expect(400);
    await put('test-city', city({ hotels: [{ id: 'h', name: 'x', starRating: 9, pricePerNight: 1, imageUrl: IMG, locationDesc: 'x', amenities: [] }] })).expect(400);
    await put('test-city', city({ transports: [{ id: 't', type: 'rocket', title: 'x', durationText: 'x', pricePerPerson: 1 }] })).expect(400);
  });

  describe('ready-made trips', () => {
    const ids = async (): Promise<string[]> =>
      ((await ctx.http.get('/api/v1/destinations/suggested-trips').expect(200)).body.data as { id: string }[]).map((t) => t.id);

    it('starts empty: no curated trips are created from code at boot', async () => {
      await ctx.app.get(AdminService).onModuleInit();
      expect(await ids()).toEqual([]);
    });
  });
});
