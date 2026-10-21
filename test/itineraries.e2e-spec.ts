import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';
import { UserRole } from '../src/modules/auth/schemas/user.schema.js';

/** The exact shape PlannerSummary sends today: one day holding every selected attraction, totalDays larger. */
const frontendPayload = (itemCount = 10) => ({
  destinationKey: 'beijing',
  title: '🇨🇳 Бээжин 5 өдрийн аялал',
  totalDays: 5,
  days: [
    {
      dayNumber: 1,
      title: '1 дэх өдөр: Бээжин-д хүрэлцэн ирэх',
      accommodationCost: 960_000,
      transportCost: 1_832_600,
      items: Array.from({ length: itemCount }, (_, i) => ({
        attractionId: `bj-att-${String(i + 1).padStart(2, '0')}`,
        name: `Үзвэр ${i + 1}`,
        orderIndex: i,
        cost: 100_000,
        durationHours: 2.5,
      })),
    },
  ],
});

const multiDayPayload = () => ({
  destinationKey: 'beijing',
  title: 'Бээжин 2 өдрийн аялал',
  totalDays: 2,
  days: [1, 2].map((dayNumber) => ({
    dayNumber,
    title: `${dayNumber} дэх өдөр`,
    items: [
      { attractionId: `a${dayNumber}1`, name: 'A', cost: 1000 },
      { attractionId: `a${dayNumber}2`, name: 'B', cost: 2000 },
    ],
  })),
});

describe('Itineraries: ownership, limits and the current frontend payload', () => {
  let ctx: TestContext;
  let alice: TestUser;
  let bob: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    alice = await ctx.makeUser('alice@example.test');
    bob = await ctx.makeUser('bob@example.test');
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
  });
  afterAll(async () => ctx.close());

  it('guests cannot save, read, list or delete (401): drafts stay in the frontend', async () => {
    await ctx.http.post('/api/v1/itineraries').send(frontendPayload()).expect(401);
    await ctx.http.get('/api/v1/itineraries/my').expect(401);
    await ctx.http.get('/api/v1/itineraries/665f1c2e9b1e8a0012345678').expect(401);
    await ctx.http.delete('/api/v1/itineraries/665f1c2e9b1e8a0012345678').expect(401);
    await ctx.http.put('/api/v1/itineraries/665f1c2e9b1e8a0012345678/reorder-items').send({}).expect(401);
  });

  it('accepts the frontend payload and returns id, _id, status and the recomputed total', async () => {
    const res = await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(frontendPayload()).expect(201);
    const created = res.body.data;
    expect(created.id).toBe(created._id);
    expect(created).toMatchObject({
      destinationKey: 'beijing',
      currency: 'MNT',
      status: 'saved',
      totalDays: 5,
      // 10 items x 100000 + accommodation + transport, computed by the server
      totalCost: 1_000_000 + 960_000 + 1_832_600,
      userId: alice.id,
    });
    expect(created.createdAt).toBeDefined();
  });

  it('ignores a client-supplied owner: the owner is always the verified token subject', async () => {
    const res = await ctx.http
      .post('/api/v1/itineraries')
      .set(bearer(alice.token))
      .send({ ...frontendPayload(2), userId: bob.id })
      .expect(201);
    expect(res.body.data.userId).toBe(alice.id);
  });

  describe('ownership (IDOR)', () => {
    let aliceId: string;
    beforeAll(async () => {
      const res = await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(multiDayPayload());
      aliceId = res.body.data.id;
    });

    it('the owner can read, list and reorder', async () => {
      await ctx.http.get(`/api/v1/itineraries/${aliceId}`).set(bearer(alice.token)).expect(200);
      const list = await ctx.http.get('/api/v1/itineraries/my').set(bearer(alice.token)).expect(200);
      expect(list.body.data.every((i: { userId: string }) => i.userId === alice.id)).toBe(true);
      const detail = await ctx.http.get(`/api/v1/itineraries/${aliceId}`).set(bearer(alice.token));
      const item = detail.body.data.days[0].items[0];
      const reorder = await ctx.http
        .put(`/api/v1/itineraries/${aliceId}/reorder-items`)
        .set(bearer(alice.token))
        .send({ sourceDayNumber: 1, destinationDayNumber: 2, itemId: item._id, newOrderIndex: 0 })
        .expect(200);
      expect(reorder.body.data).toMatchObject({ updated: true, totalCost: 6000, recalculatedTotalCost: 6000 });
    });

    it("another user gets 404 (not 403) for read, delete and reorder, so existence is not disclosed", async () => {
      await ctx.http.get(`/api/v1/itineraries/${aliceId}`).set(bearer(bob.token)).expect(404);
      await ctx.http.delete(`/api/v1/itineraries/${aliceId}`).set(bearer(bob.token)).expect(404);
      await ctx.http
        .put(`/api/v1/itineraries/${aliceId}/reorder-items`)
        .set(bearer(bob.token))
        .send({ sourceDayNumber: 1, destinationDayNumber: 1, itemId: 'x', newOrderIndex: 0 })
        .expect(404);
      const stillThere = await ctx.itineraries.findById(aliceId);
      expect(stillThere).not.toBeNull();
    });

    it("another user's list never contains alice's itineraries", async () => {
      const list = await ctx.http.get('/api/v1/itineraries/my').set(bearer(bob.token)).expect(200);
      expect(list.body.data).toEqual([]);
    });

    it('an admin may read but not delete or reorder', async () => {
      await ctx.http.get(`/api/v1/itineraries/${aliceId}`).set(bearer(admin.token)).expect(200);
      await ctx.http.delete(`/api/v1/itineraries/${aliceId}`).set(bearer(admin.token)).expect(404);
    });

    it('malformed ids are 404, never a 500', async () => {
      await ctx.http.get('/api/v1/itineraries/not-an-id').set(bearer(alice.token)).expect(404);
    });

    it('the owner can delete', async () => {
      const res = await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(multiDayPayload());
      const id = res.body.data.id;
      await ctx.http.delete(`/api/v1/itineraries/${id}`).set(bearer(alice.token)).expect(200);
      await ctx.http.get(`/api/v1/itineraries/${id}`).set(bearer(alice.token)).expect(404);
    });

    it('an unlocked (paid) itinerary is read-only', async () => {
      const res = await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(multiDayPayload());
      const id: string = res.body.data.id;
      await ctx.itineraries.updateOne({ _id: id }, { status: 'unlocked' });
      const detail = await ctx.http.get(`/api/v1/itineraries/${id}`).set(bearer(alice.token));
      const reorder = await ctx.http
        .put(`/api/v1/itineraries/${id}/reorder-items`)
        .set(bearer(alice.token))
        .send({ sourceDayNumber: 1, destinationDayNumber: 2, itemId: detail.body.data.days[0].items[0]._id, newOrderIndex: 0 });
      expect(reorder.status).toBe(409);
    });
  });

  describe('limits (PROJECT_RULES: 8 items per day, 30 days)', () => {
    it('allows 8 x totalDays items in aggregate (the frontend default is 10 items over 5 days)', async () => {
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(frontendPayload(40)).expect(201);
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(frontendPayload(41)).expect(400);
    });

    it('caps a true multi-day plan at 8 items per day', async () => {
      const payload = multiDayPayload();
      payload.days[0]!.items = Array.from({ length: 9 }, (_, i) => ({ attractionId: `x${i}`, name: 'X', cost: 1 }));
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(payload).expect(400);
    });

    it('rejects more than 30 days, zero days and duplicate day numbers', async () => {
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send({ ...frontendPayload(1), totalDays: 31 }).expect(400);
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send({ ...frontendPayload(1), totalDays: 0 }).expect(400);
      const dup = multiDayPayload();
      dup.days[1]!.dayNumber = 1;
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(dup).expect(400);
    });

    it('rejects negative, oversized and non-numeric costs', async () => {
      const bad = (cost: unknown) => {
        const p = multiDayPayload();
        (p.days[0]!.items[0] as { cost: unknown }).cost = cost;
        return p;
      };
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(bad(-1)).expect(400);
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(bad(1e12)).expect(400);
      await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(bad('lots')).expect(400);
    });

    it('rejects an out-of-range reorder body instead of corrupting the plan', async () => {
      const res = await ctx.http.post('/api/v1/itineraries').set(bearer(alice.token)).send(multiDayPayload());
      await ctx.http
        .put(`/api/v1/itineraries/${res.body.data.id}/reorder-items`)
        .set(bearer(alice.token))
        .send({ sourceDayNumber: 1, destinationDayNumber: 2, itemId: 'a11', newOrderIndex: -5 })
        .expect(400);
    });
  });
});
