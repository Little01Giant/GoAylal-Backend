import { Types } from 'mongoose';
import { PaymentsService } from '../src/modules/payments/payments.service.js';
import { PaymentStatus } from '../src/modules/payments/schemas/payment-transaction.schema.js';
import { UserRole } from '../src/modules/auth/schemas/user.schema.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

const INVOICE = '/api/v1/payments/qpay/create-invoice';
const FEE = 20000;

const plan = (grandTotalCost: number, destinationName = 'Бээжин') => ({
  destinationName,
  daysCount: 5,
  nightsCount: 4,
  travelersCount: 2,
  roomsCount: 1,
  grandTotalCost,
});

describe('Payments: server-side fee, QPay-confirmed settlement, ownership', () => {
  let ctx: TestContext;
  let payments: PaymentsService;
  let alice: TestUser;
  let bob: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp({ PAYMENT_EMAIL_ENABLED: 'true' });
    payments = ctx.app.get(PaymentsService);
    alice = await ctx.makeUser('alice@example.test');
    bob = await ctx.makeUser('bob@example.test');
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
  });
  afterAll(async () => ctx.close());

  /** createdAt is immutable through Mongoose, so age an invoice with a raw write. */
  const ageInvoice = async (id: unknown): Promise<void> => {
    await ctx.payments.collection.updateOne(
      { _id: new Types.ObjectId(String(id)) },
      { $set: { createdAt: new Date(Date.now() - 20 * 60 * 1000) } },
    );
  };

  const payFor = (invoiceId: string): void => {
    ctx.qpay.paid.add(invoiceId);
  };

  describe('guest checkout (transitional, GUEST_CHECKOUT_ENABLED=true)', () => {
    it('always charges the server-side fee and ignores the client amount', async () => {
      const res = await ctx.http
        .post(INVOICE)
        .send({ email: 'guest1@example.test', amount: 1, userId: bob.id, title: 'Бээжин аяллын бүрэн төлөвлөгөө', planSnapshot: plan(1_000_000) })
        .expect(201);
      const data = res.body.data;
      expect(data.amount).toBe(FEE);
      expect(data.currency).toBe('MNT');
      expect(data.transactionNumber).toMatch(/^TRX-\d{4}-\d{4}-\d{4}$/);
      expect(data.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}-\d{4}$/);
      expect(data.transactionId).toBeDefined();
      expect(data.qpayInvoice).toMatchObject({
        invoiceId: expect.any(String),
        qrText: expect.any(String),
        qrImage: expect.any(String),
        qPayShortUrl: expect.any(String),
        urls: [expect.objectContaining({ name: 'Bank', link: 'bank://pay' })],
      });

      const stored = await ctx.payments.findById(data.transactionId);
      expect(stored?.amount).toBe(FEE);
      expect(stored?.userId).toBeUndefined();
      expect(stored?.status).toBe(PaymentStatus.PENDING);
    });

    it('does not trust the snapshot: unknown fields are dropped and the charge is unchanged', async () => {
      const res = await ctx.http
        .post(INVOICE)
        .send({ email: 'guest2@example.test', planSnapshot: { ...plan(5), isAdmin: true, amountToPay: 1 } })
        .expect(201);
      expect(res.body.data.amount).toBe(FEE);
      const stored = await ctx.payments.findById(res.body.data.transactionId);
      expect(stored?.planSnapshot).toMatchObject({ destinationName: 'Бээжин', grandTotalCost: 5 });
      expect(stored?.planSnapshot).not.toHaveProperty('isAdmin');
      expect(stored?.planSnapshot).not.toHaveProperty('amountToPay');
    });

    it('requires a valid email for guests', async () => {
      await ctx.http.post(INVOICE).send({ planSnapshot: plan(1) }).expect(400);
      await ctx.http.post(INVOICE).send({ email: 'not-an-email' }).expect(400);
    });

    it('treats a placeholder itinerary id such as "itn-temp" as "no itinerary" and never links a real one', async () => {
      const res = await ctx.http.post(INVOICE).send({ email: 'guest3@example.test', itineraryId: 'itn-temp' }).expect(201);
      const stored = await ctx.payments.findById(res.body.data.transactionId);
      expect(stored?.itineraryId).toBeUndefined();

      const someoneElses = await ctx.http
        .post('/api/v1/itineraries')
        .set(bearer(alice.token))
        .send({ destinationKey: 'beijing', title: 'T', totalDays: 1, days: [{ dayNumber: 1, title: 'D', items: [] }] });
      const guest = await ctx.http
        .post(INVOICE)
        .send({ email: 'guest4@example.test', itineraryId: someoneElses.body.data.id })
        .expect(201);
      const guestTxn = await ctx.payments.findById(guest.body.data.transactionId);
      expect(guestTxn?.itineraryId).toBeUndefined();
    });

    it('returns the same pending invoice for the same payer and plan', async () => {
      const body = { email: 'dedupe@example.test', planSnapshot: plan(777) };
      const first = await ctx.http.post(INVOICE).send(body).expect(201);
      const second = await ctx.http.post(INVOICE).send(body).expect(201);
      expect(second.body.data.transactionId).toBe(first.body.data.transactionId);
      const other = await ctx.http.post(INVOICE).send({ ...body, planSnapshot: plan(778) }).expect(201);
      expect(other.body.data.transactionId).not.toBe(first.body.data.transactionId);
    });
  });

  describe('settlement is only ever driven by QPay', () => {
    let invoice: { transactionId: string; transactionNumber: string; qpayInvoice: { invoiceId: string } };

    beforeAll(async () => {
      const res = await ctx.http.post(INVOICE).send({ email: 'settle@example.test', planSnapshot: plan(1234) });
      invoice = res.body.data;
    });

    it('verify reports unpaid and does not settle; simulate is ignored outside mock mode', async () => {
      const res = await ctx.http.post(`/api/v1/payments/verify/${invoice.transactionId}`).send({ simulate: true }).expect(200);
      expect(res.body.data).toEqual({ verified: false, transactionNumber: invoice.transactionNumber, status: 'pending' });
      expect((await ctx.payments.findById(invoice.transactionId))?.status).toBe(PaymentStatus.PENDING);
    });

    it('a forged callback (valid invoice id, nothing paid) does not settle', async () => {
      const res = await ctx.http
        .post('/api/v1/payments/qpay/callback')
        .send({ payment_id: invoice.qpayInvoice.invoiceId })
        .expect(200);
      expect(res.body.data).toMatchObject({ received: true, verified: false });
      expect((await ctx.payments.findById(invoice.transactionId))?.status).toBe(PaymentStatus.PENDING);
    });

    it('callback and verify answer 404 for unknown payments and 400 for a malformed body', async () => {
      await ctx.http.post('/api/v1/payments/qpay/callback').send({ payment_id: 'does-not-exist' }).expect(404);
      await ctx.http.post('/api/v1/payments/qpay/callback').send({}).expect(404);
      await ctx.http.post('/api/v1/payments/verify/does-not-exist').send({}).expect(404);
      await ctx.http.post(`/api/v1/payments/verify/${invoice.transactionId}`).send({ simulate: 'yes' }).expect(400);
    });

    it('settles once QPay reports the invoice as paid', async () => {
      payFor(invoice.qpayInvoice.invoiceId);
      const res = await ctx.http.post(`/api/v1/payments/verify/${invoice.transactionId}`).send({}).expect(200);
      expect(res.body.data).toEqual({ verified: true, transactionNumber: invoice.transactionNumber, status: 'completed' });
      const stored = await ctx.payments.findById(invoice.transactionId);
      expect(stored?.status).toBe(PaymentStatus.COMPLETED);
      expect(stored?.paidAt).toBeInstanceOf(Date);
    });

    it('simulate settles only when QPay mock mode is on (never in production)', async () => {
      const res = await ctx.http.post(INVOICE).send({ email: 'mock@example.test', planSnapshot: plan(4321) });
      const id = res.body.data.transactionId as string;
      await ctx.http.post(`/api/v1/payments/verify/${id}`).send({ simulate: true }).expect(200);
      expect((await ctx.payments.findById(id))?.status).toBe(PaymentStatus.PENDING);

      ctx.qpay.isMock = true;
      try {
        const settled = await ctx.http.post(`/api/v1/payments/verify/${id}`).send({ simulate: true }).expect(200);
        expect(settled.body.data.verified).toBe(true);
      } finally {
        ctx.qpay.isMock = false;
      }
    });

    it('concurrent verify, callback and recheck calls produce exactly one settlement and one email', async () => {
      const created = await payments.createQPayInvoice({ email: 'race@example.test', planSnapshot: plan(999) });
      payFor(created.qpayInvoice.invoiceId);
      const emailsBefore = ctx.email.sent;

      const calls = Array.from({ length: 10 }, () => [
        ctx.http.post(`/api/v1/payments/verify/${created.transactionId}`).send({}),
        ctx.http.post('/api/v1/payments/qpay/callback').send({ payment_id: created.qpayInvoice.invoiceId }),
        ctx.http.post(`/api/v1/admin/transactions/${created.transactionId}/recheck`).set(bearer(admin.token)),
      ]).flat();
      const results = await Promise.all(calls);

      expect(results.every((r) => r.status === 200 && r.body.data.verified === true)).toBe(true);
      expect(ctx.email.sent - emailsBefore).toBe(1);
      expect(await ctx.payments.countDocuments({ _id: created.transactionId, status: PaymentStatus.COMPLETED })).toBe(1);
    });

    it('a settled payment never moves backwards or gets re-settled', async () => {
      const before = (await ctx.payments.findById(invoice.transactionId))?.paidAt;
      await ctx.http.post(`/api/v1/payments/verify/${invoice.transactionId}`).send({}).expect(200);
      expect((await ctx.payments.findById(invoice.transactionId))?.paidAt).toEqual(before);
    });
  });

  describe('reference numbers', () => {
    it('are unique under concurrent creation', async () => {
      const created = await Promise.all(
        Array.from({ length: 40 }, (_, i) => payments.createQPayInvoice({ email: `bulk${i}@example.test`, planSnapshot: plan(i) })),
      );
      expect(new Set(created.map((c) => c.transactionNumber)).size).toBe(40);
      expect(new Set(created.map((c) => c.invoiceNumber)).size).toBe(40);
      expect(new Set(created.map((c) => c.qpayInvoice.invoiceId)).size).toBe(40);
    });
  });

  describe('stale pending invoices', () => {
    it('are expired and replaced when QPay shows no payment', async () => {
      const first = await payments.createQPayInvoice({ email: 'stale@example.test', planSnapshot: plan(555) });
      await ageInvoice(first.transactionId);
      const second = await payments.createQPayInvoice({ email: 'stale@example.test', planSnapshot: plan(555) });
      expect(String(second.transactionId)).not.toBe(String(first.transactionId));
      expect((await ctx.payments.findById(first.transactionId))?.status).toBe(PaymentStatus.EXPIRED);
    });

    it('are settled instead of re-invoiced when the payer actually paid', async () => {
      const first = await payments.createQPayInvoice({ email: 'late@example.test', planSnapshot: plan(556) });
      await ageInvoice(first.transactionId);
      payFor(first.qpayInvoice.invoiceId);
      const again = await payments.createQPayInvoice({ email: 'late@example.test', planSnapshot: plan(556) });
      expect(String(again.transactionId)).toBe(String(first.transactionId));
      expect((await ctx.payments.findById(first.transactionId))?.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('authenticated payer: itinerary ownership, unlock and receipts', () => {
    let itineraryId: string;
    let invoice: { transactionId: string; qpayInvoice: { invoiceId: string } };

    beforeAll(async () => {
      const it = await ctx.http
        .post('/api/v1/itineraries')
        .set(bearer(alice.token))
        .send({ destinationKey: 'beijing', title: 'Бээжин', totalDays: 2, days: [{ dayNumber: 1, title: 'D', items: [] }] });
      itineraryId = it.body.data.id;
    });

    it("cannot pay for another user's itinerary (404) and cannot override the payer", async () => {
      await ctx.http.post(INVOICE).set(bearer(bob.token)).send({ itineraryId }).expect(404);
      const res = await ctx.http.post(INVOICE).set(bearer(alice.token)).send({ itineraryId, userId: bob.id }).expect(201);
      invoice = res.body.data;
      const stored = await ctx.payments.findById(invoice.transactionId);
      expect(stored?.userId?.toString()).toBe(alice.id);
      expect(stored?.itineraryId?.toString()).toBe(itineraryId);
      expect(stored?.customerEmail).toBe('alice@example.test');
      expect(res.body.data.amount).toBe(FEE);
    });

    it('rejects an invalid token on the optional-auth payment route instead of falling back to guest', async () => {
      await ctx.http.post(INVOICE).set('Authorization', 'Bearer forged.token.value').send({ email: 'x@example.test' }).expect(401);
    });

    it('unlocks the itinerary and blocks a second charge once paid', async () => {
      payFor(invoice.qpayInvoice.invoiceId);
      await ctx.http.post(`/api/v1/payments/verify/${invoice.transactionId}`).send({}).expect(200);
      expect((await ctx.itineraries.findById(itineraryId))?.status).toBe('unlocked');
      await ctx.http.post(INVOICE).set(bearer(alice.token)).send({ itineraryId }).expect(409);
    });

    it('lets only the payer (and admins) read the receipt; guests get 401', async () => {
      const url = `/api/v1/payments/receipt/${invoice.transactionId}`;
      await ctx.http.get(url).expect(401);
      await ctx.http.get(url).set(bearer(bob.token)).expect(404);
      const mine = await ctx.http.get(url).set(bearer(alice.token)).expect(200);
      expect(mine.body.data).toMatchObject({ status: 'completed', amount: FEE, currency: 'MNT' });
      expect(mine.body.data.dedupeKey).toBeUndefined();
      await ctx.http.get(url).set(bearer(admin.token)).expect(200);
    });

    it('scopes payment history to the caller', async () => {
      await ctx.http.get('/api/v1/payments/my').expect(401);
      const mine = await ctx.http.get('/api/v1/payments/my').set(bearer(alice.token)).expect(200);
      expect(mine.body.data.map((p: { id: string }) => p.id)).toContain(invoice.transactionId);
      expect(mine.body.data[0]).toMatchObject({
        paymentMethod: 'qpay',
        status: expect.stringMatching(/^(pending|completed|failed|expired|refunded)$/),
        statusLabel: expect.any(String),
        items: expect.any(Array),
      });
      const theirs = await ctx.http.get('/api/v1/payments/my').set(bearer(bob.token)).expect(200);
      expect(theirs.body.data).toEqual([]);
    });
  });

  describe('guest payment is claimed by the account with the same verified email', () => {
    it('shows up for that account only, after payment, and only once', async () => {
      const res = await ctx.http.post(INVOICE).send({ email: 'carol@example.test', planSnapshot: plan(8888) }).expect(201);
      const id = res.body.data.transactionId as string;
      const carol = await ctx.makeUser('carol@example.test');

      const beforePay = await ctx.http.get('/api/v1/payments/my').set(bearer(carol.token)).expect(200);
      expect(beforePay.body.data).toEqual([]);

      payFor(res.body.data.qpayInvoice.invoiceId);
      await ctx.http.post(`/api/v1/payments/verify/${id}`).send({}).expect(200);

      const afterPay = await ctx.http.get('/api/v1/payments/my').set(bearer(carol.token)).expect(200);
      expect(afterPay.body.data.map((p: { id: string }) => p.id)).toEqual([id]);
      await ctx.http.get(`/api/v1/payments/receipt/${id}`).set(bearer(carol.token)).expect(200);
      expect((await ctx.payments.findById(id))?.userId?.toString()).toBe(carol.id);

      await ctx.http.get(`/api/v1/payments/receipt/${id}`).set(bearer(bob.token)).expect(404);
    });
  });

  describe('API only ever emits the five documented statuses', () => {
    it('across the admin transaction list', async () => {
      const res = await ctx.http.get('/api/v1/admin/transactions?limit=100').set(bearer(admin.token)).expect(200);
      const statuses = new Set<string>(res.body.data.items.map((t: { status: string }) => t.status));
      for (const status of statuses) {
        expect(['pending', 'completed', 'failed', 'expired', 'refunded']).toContain(status);
      }
      expect(res.body.data.items.every((t: { dedupeKey?: string }) => t.dedupeKey === undefined)).toBe(true);
    });

    it('admin stats are consistent with the list', async () => {
      const stats = await ctx.http.get('/api/v1/admin/stats').set(bearer(admin.token)).expect(200);
      const completed = await ctx.payments.countDocuments({ status: PaymentStatus.COMPLETED });
      expect(stats.body.data.completedTransactions).toBe(completed);
      expect(stats.body.data.totalRevenue).toBe(completed * FEE);
    });
  });
});

describe('Payments: guest checkout disabled (target state)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp({ GUEST_CHECKOUT_ENABLED: 'false' });
  });
  afterAll(async () => ctx.close());

  it('requires login to create an invoice, but authenticated payers still work', async () => {
    const res = await ctx.http.post(INVOICE).send({ email: 'guest@example.test' }).expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    const user = await ctx.makeUser('member@example.test');
    await ctx.http.post(INVOICE).set(bearer(user.token)).send({ planSnapshot: plan(1) }).expect(201);
  });
});

describe('Payments: configurable fee and abuse limits', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp({ UNLOCK_FEE_MNT: '35000', RATE_LIMIT_DISABLED: 'false' });
  });
  afterAll(async () => ctx.close());

  it('uses UNLOCK_FEE_MNT as the one source of truth', async () => {
    const res = await ctx.http.post(INVOICE).send({ email: 'fee@example.test', amount: 100 }).expect(201);
    expect(res.body.data.amount).toBe(35000);
  });

  it('rate limits invoice creation per client', async () => {
    let last = 201;
    for (let i = 0; i < 12; i++) {
      const res = await ctx.http.post(INVOICE).send({ email: `rl${i}@example.test`, planSnapshot: plan(i) });
      last = res.status;
      if (res.status === 429) {
        expect(res.body.code).toBe('RATE_LIMITED');
        break;
      }
    }
    expect(last).toBe(429);
  });
});
