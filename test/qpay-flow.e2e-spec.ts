import { Types } from 'mongoose';
import { PaymentStatus } from '../src/modules/payments/schemas/payment-transaction.schema.js';
import { UserRole } from '../src/modules/auth/schemas/user.schema.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

const INVOICE = '/api/v1/payments/qpay/create-invoice';
const CALLBACK = '/api/v1/payments/qpay/callback';
const STATUS = '/api/v1/payments/status';
const BULK = '/api/v1/admin/transactions/bulk';

describe('QPay flow: per-invoice callback, throttled status poll, invoice cancel', () => {
  let ctx: TestContext;
  let admin: TestUser;
  let counter = 0;

  beforeAll(async () => {
    ctx = await createTestApp({ GUEST_CHECKOUT_ENABLED: 'true' });
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
  });
  afterAll(async () => ctx.close());

  const newInvoice = async (): Promise<{ id: string; invoiceNumber: string; qpayInvoiceId: string }> => {
    const res = await ctx.http
      .post(INVOICE)
      .send({ email: `payer${++counter}@example.test`, planSnapshot: { destinationName: `D${counter}`, grandTotalCost: counter } })
      .expect(201);
    return {
      id: res.body.data.transactionId as string,
      invoiceNumber: res.body.data.invoiceNumber as string,
      qpayInvoiceId: res.body.data.qpayInvoice.invoiceId as string,
    };
  };
  const status = async (id: string) => (await ctx.payments.findById(id).lean().exec())?.status;
  const age = async (id: string, field: 'createdAt' | 'lastQpayCheckAt', ms: number): Promise<void> => {
    await ctx.payments.collection.updateOne({ _id: new Types.ObjectId(id) }, { $set: { [field]: new Date(Date.now() - ms) } });
  };

  describe('callback by invoice number', () => {
    it('settles a paid invoice for both POST and GET, identified by the URL alone', async () => {
      const a = await newInvoice();
      const b = await newInvoice();
      ctx.qpay.paid.add(a.qpayInvoiceId);
      ctx.qpay.paid.add(b.qpayInvoiceId);

      const post = await ctx.http.post(`${CALLBACK}/${a.invoiceNumber}`).send({ anything: 'ignored' }).expect(200);
      expect(post.body.data).toMatchObject({ received: true, verified: true });
      const get = await ctx.http.get(`${CALLBACK}/${b.invoiceNumber}?qpay_payment_id=whatever`).expect(200);
      expect(get.body.data).toMatchObject({ received: true, verified: true });
      expect(await status(a.id)).toBe(PaymentStatus.COMPLETED);
      expect(await status(b.id)).toBe(PaymentStatus.COMPLETED);
    });

    it('never trusts the callback: an unpaid invoice stays pending', async () => {
      const inv = await newInvoice();
      const res = await ctx.http.post(`${CALLBACK}/${inv.invoiceNumber}`).send({ payment_id: 'PAID', status: 'PAID' }).expect(200);
      expect(res.body.data.verified).toBe(false);
      expect(await status(inv.id)).toBe(PaymentStatus.PENDING);
    });

    it('answers 404 for an unknown invoice number', async () => {
      await ctx.http.post(`${CALLBACK}/INV-0000-0000-0000`).send({}).expect(404);
      await ctx.http.get(`${CALLBACK}/INV-0000-0000-0000`).expect(404);
    });

    it('is idempotent: a repeated callback settles once', async () => {
      const inv = await newInvoice();
      ctx.qpay.paid.add(inv.qpayInvoiceId);
      await ctx.http.post(`${CALLBACK}/${inv.invoiceNumber}`).expect(200);
      const again = await ctx.http.post(`${CALLBACK}/${inv.invoiceNumber}`).expect(200);
      expect(again.body.data.verified).toBe(true);
      expect(await status(inv.id)).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('status poll', () => {
    it('asks QPay at most once per interval however often the dialog polls', async () => {
      const inv = await newInvoice();
      const before = ctx.qpay.checks;
      for (let i = 0; i < 6; i++) {
        const res = await ctx.http.get(`${STATUS}/${inv.id}`).expect(200);
        expect(res.body.data).toMatchObject({ verified: false, status: 'pending' });
      }
      expect(ctx.qpay.checks - before).toBe(1);

      // After the interval has passed, the next poll may ask again.
      await age(inv.id, 'lastQpayCheckAt', 25_000);
      await ctx.http.get(`${STATUS}/${inv.id}`).expect(200);
      expect(ctx.qpay.checks - before).toBe(2);
    });

    it('is the safety net when the callback never arrives: it settles a paid invoice', async () => {
      const inv = await newInvoice();
      ctx.qpay.paid.add(inv.qpayInvoiceId);
      const res = await ctx.http.get(`${STATUS}/${inv.id}`).expect(200);
      expect(res.body.data).toMatchObject({ verified: true, status: 'completed' });
      expect(await status(inv.id)).toBe(PaymentStatus.COMPLETED);
    });

    it('does not ask QPay about a settled invoice and 404s an unknown one', async () => {
      const inv = await newInvoice();
      ctx.qpay.paid.add(inv.qpayInvoiceId);
      await ctx.http.get(`${STATUS}/${inv.id}`).expect(200);
      const before = ctx.qpay.checks;
      await ctx.http.get(`${STATUS}/${inv.id}`).expect(200);
      expect(ctx.qpay.checks).toBe(before);
      await ctx.http.get(`${STATUS}/64b64b64b64b64b64b64b64b`).expect(404);
    });
  });

  describe('cancelling invoices we give up on', () => {
    it('cancels the stale invoice at QPay when a fresh one replaces it', async () => {
      const email = 'stale@example.test';
      const body = { email, planSnapshot: { destinationName: 'Stale', grandTotalCost: 1 } };
      const first = await ctx.http.post(INVOICE).send(body).expect(201);
      await age(first.body.data.transactionId as string, 'createdAt', 20 * 60 * 1000);
      const second = await ctx.http.post(INVOICE).send(body).expect(201);
      expect(second.body.data.transactionId).not.toBe(first.body.data.transactionId);
      expect(await status(first.body.data.transactionId as string)).toBe(PaymentStatus.EXPIRED);
      expect(ctx.qpay.cancelled.has(first.body.data.qpayInvoice.invoiceId as string)).toBe(true);
    });

    it('cancels at QPay when an admin expires pending invoices in bulk, but not a paid one', async () => {
      const unpaid = await newInvoice();
      const paid = await newInvoice();
      ctx.qpay.paid.add(paid.qpayInvoiceId);
      const res = await ctx.http
        .post(BULK)
        .set(bearer(admin.token))
        .send({ ids: [unpaid.id, paid.id], action: 'expire-pending' })
        .expect(200);
      expect(res.body.data).toMatchObject({ modified: 1, settled: 1 });
      expect(ctx.qpay.cancelled.has(unpaid.qpayInvoiceId)).toBe(true);
      expect(ctx.qpay.cancelled.has(paid.qpayInvoiceId)).toBe(false);
    });

    it('still settles an invoice that was paid after we had expired it', async () => {
      const inv = await newInvoice();
      await ctx.payments.updateOne({ _id: inv.id }, { $set: { status: PaymentStatus.EXPIRED } });
      expect(await status(inv.id)).toBe(PaymentStatus.EXPIRED);

      ctx.qpay.paid.add(inv.qpayInvoiceId);
      const res = await ctx.http.post(`${CALLBACK}/${inv.invoiceNumber}`).expect(200);
      expect(res.body.data).toMatchObject({ received: true, verified: true });
      expect(await status(inv.id)).toBe(PaymentStatus.COMPLETED);
    });
  });
});
