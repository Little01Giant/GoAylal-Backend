import { bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

const CHAT = '/api/v1/ai/chat';

describe('AI planner: ownership, input limits and request parsing', () => {
  let ctx: TestContext;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    alice = await ctx.makeUser('alice@example.test');
    bob = await ctx.makeUser('bob@example.test');
  });
  afterAll(async () => ctx.close());

  it('builds a plan from the message and returns both sessionId and the conversationId alias', async () => {
    const res = await ctx.http.post(CHAT).send({ message: 'Бээжин 3 өдөр 4 хүн' }).expect(200);
    const data = res.body.data;
    expect(data.sessionId).toBeDefined();
    expect(data.conversationId).toBe(data.sessionId);
    expect(data.role).toBe('assistant');
    expect(data.plan).toMatchObject({ city: { key: 'beijing' }, days: 3, travelers: 4 });
    expect(data.plan.grandTotalCost).toBeGreaterThan(0);
    expect(Array.isArray(data.quickSuggestions)).toBe(true);
  });

  it('does not misread digits that are not a trip length (regression: "13", "300000₮")', async () => {
    const res = await ctx.http.post(CHAT).send({ message: 'Бээжин 300000₮ төсөвтэй, 13 найз' }).expect(200);
    expect(res.body.data.plan.days).toBe(5);
  });

  it('asks instead of defaulting to Beijing when no destination is named', async () => {
    const res = await ctx.http.post(CHAT).send({ message: 'Сайн байна уу' }).expect(200);
    expect(res.body.data.plan).toBeUndefined();
    expect(res.body.data.content).toContain('аль улс');
    expect(res.body.data.quickSuggestions.length).toBeGreaterThan(0);
  });

  it('rejects empty, oversized and non-string messages', async () => {
    await ctx.http.post(CHAT).send({ message: '' }).expect(400);
    await ctx.http.post(CHAT).send({ message: 'x'.repeat(1001) }).expect(400);
    await ctx.http.post(CHAT).send({ message: 42 }).expect(400);
    await ctx.http.post(CHAT).send({ message: 'x'.repeat(1000) }).expect(200);
  });

  it('keeps an owned conversation private: another user gets a fresh session instead of access', async () => {
    const first = await ctx.http.post(CHAT).set(bearer(alice.token)).send({ message: 'Токио 5 өдөр' }).expect(200);
    const aliceSession = first.body.data.sessionId as string;

    const hijack = await ctx.http.post(CHAT).set(bearer(bob.token)).send({ message: 'Hello', sessionId: aliceSession }).expect(200);
    expect(hijack.body.data.sessionId).not.toBe(aliceSession);

    const guest = await ctx.http.post(CHAT).send({ message: 'Hello', sessionId: aliceSession }).expect(200);
    expect(guest.body.data.sessionId).not.toBe(aliceSession);

    const continued = await ctx.http.post(CHAT).set(bearer(alice.token)).send({ message: 'Дахин', sessionId: aliceSession }).expect(200);
    expect(continued.body.data.sessionId).toBe(aliceSession);
  });

  it('adopts an anonymous conversation when its starter signs in, then protects it', async () => {
    const anon = await ctx.http.post(CHAT).send({ message: 'Дубай 4 өдөр' }).expect(200);
    const sessionId = anon.body.data.sessionId as string;
    const adopted = await ctx.http.post(CHAT).set(bearer(bob.token)).send({ message: 'Үргэлжлүүл', sessionId }).expect(200);
    expect(adopted.body.data.sessionId).toBe(sessionId);
    const other = await ctx.http.post(CHAT).set(bearer(alice.token)).send({ message: 'Үргэлжлүүл', sessionId }).expect(200);
    expect(other.body.data.sessionId).not.toBe(sessionId);
  });

  it('accepts the documented conversationId name for the session', async () => {
    const first = await ctx.http.post(CHAT).send({ message: 'Сөүл 3 өдөр' }).expect(200);
    const again = await ctx.http.post(CHAT).send({ message: 'Дахин', conversationId: first.body.data.sessionId }).expect(200);
    expect(again.body.data.sessionId).toBe(first.body.data.sessionId);
  });
});

describe('AI planner: rate limit', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ RATE_LIMIT_DISABLED: 'false' });
  });
  afterAll(async () => ctx.close());

  it('throttles a single client (20 requests per minute)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 22; i++) {
      statuses.push((await ctx.http.post(CHAT).send({ message: 'Бээжин' })).status);
    }
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(20)).toEqual([429, 429]);
  });
});
