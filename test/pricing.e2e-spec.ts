import { PaymentStatus } from '../src/modules/payments/schemas/payment-transaction.schema.js';
import { UserRole } from '../src/modules/auth/schemas/user.schema.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

const PLANS = '/api/v1/admin/pricing/plans';
const DISCOUNTS = '/api/v1/admin/pricing/discounts';
const SETTINGS = '/api/v1/admin/payment-settings';
const TRANSACTIONS_BULK = '/api/v1/admin/transactions/bulk';
const INVOICE = '/api/v1/payments/qpay/create-invoice';
const BASE = 20000;

interface PlanJson {
  id: string;
  code: string;
  price: number;
  finalPrice: number;
  isDefault: boolean;
}

interface DiscountJson {
  id: string;
  value: number;
  status: string;
  isActive: boolean;
  appliesToAll: boolean;
  planIds: string[];
  endsAt: string | null;
}

describe('Admin pricing: plans, discounts, payment settings and bulk actions', () => {
  let ctx: TestContext;
  let admin: TestUser;
  let member: TestUser;
  let guestCounter = 0;

  beforeAll(async () => {
    ctx = await createTestApp({ GUEST_CHECKOUT_ENABLED: 'true' });
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
    member = await ctx.makeUser('member@example.test');
  });
  afterAll(async () => ctx.close());

  const as = (user: TestUser): { Authorization: string } => bearer(user.token);
  const listPlans = async (): Promise<PlanJson[]> => (await ctx.http.get(PLANS).set(as(admin)).expect(200)).body.data as PlanJson[];
  const listDiscounts = async (): Promise<DiscountJson[]> =>
    (await ctx.http.get(DISCOUNTS).set(as(admin)).expect(200)).body.data as DiscountJson[];
  const defaultPlan = async (): Promise<PlanJson> => {
    const plan = (await listPlans()).find((p) => p.isDefault);
    if (!plan) throw new Error('no default plan');
    return plan;
  };
  const planByCode = async (code: string): Promise<PlanJson> => {
    const plan = (await listPlans()).find((p) => p.code === code);
    if (!plan) throw new Error('no plan ' + code);
    return plan;
  };
  const trx = async (id: string) => ctx.payments.findById(id).lean().exec();
  const guestInvoice = async (body: Record<string, unknown> = {}) =>
    ctx.http.post(INVOICE).send({ email: `guest${++guestCounter}@example.test`, ...body });

  describe('authorization', () => {
    it('rejects anonymous and non-admin callers', async () => {
      await ctx.http.get(PLANS).expect(401);
      await ctx.http.get(PLANS).set(as(member)).expect(403);
      await ctx.http.post(`${PLANS}/bulk`).set(as(member)).send({ ids: [], action: 'delete' }).expect(403);
      await ctx.http.get(SETTINGS).set(as(member)).expect(403);
      await ctx.http.post(TRANSACTIONS_BULK).set(as(member)).send({ ids: [], action: 'recheck' }).expect(403);
    });
  });

  describe('plans', () => {
    it('seeds the default plan from UNLOCK_FEE_MNT', async () => {
      const plans = await listPlans();
      expect(plans).toHaveLength(1);
      expect(plans[0]).toMatchObject({ code: 'standard', price: BASE, finalPrice: BASE, isDefault: true, isActive: true });
    });

    it('creates, edits and validates plans', async () => {
      const created = await ctx.http
        .post(PLANS)
        .set(as(admin))
        .send({ code: 'premium', name: 'Премиум', price: 50000, durationDays: 30, features: [' PDF хөтөлбөр ', ''] })
        .expect(201);
      expect(created.body.data).toMatchObject({
        code: 'premium',
        price: 50000,
        durationDays: 30,
        features: ['PDF хөтөлбөр'],
        isDefault: false,
        isActive: true,
      });

      await ctx.http.post(PLANS).set(as(admin)).send({ code: 'premium', name: 'Давхар', price: 5000 }).expect(409);
      await ctx.http.post(PLANS).set(as(admin)).send({ code: 'cheap', name: 'Хямд', price: 500 }).expect(400);
      await ctx.http.post(PLANS).set(as(admin)).send({ code: 'neg', name: 'Сөрөг', price: -1 }).expect(400);
      await ctx.http.post(PLANS).set(as(admin)).send({ code: 'Bad Code', name: 'Код', price: 5000 }).expect(400);

      const id = created.body.data.id as string;
      const updated = await ctx.http.put(`${PLANS}/${id}`).set(as(admin)).send({ price: 45000, name: 'Премиум+' }).expect(200);
      expect(updated.body.data).toMatchObject({ price: 45000, name: 'Премиум+', code: 'premium' });
      await ctx.http.put(`${PLANS}/not-an-id`).set(as(admin)).send({ price: 45000 }).expect(404);
    });

    it('keeps exactly one active default plan', async () => {
      const standard = await defaultPlan();
      const premium = await planByCode('premium');

      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ isDefault: false }).expect(400);
      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ isActive: false }).expect(400);
      await ctx.http.delete(`${PLANS}/${standard.id}`).set(as(admin)).expect(409);

      await ctx.http.put(`${PLANS}/${premium.id}`).set(as(admin)).send({ isDefault: true }).expect(200);
      expect((await listPlans()).filter((p) => p.isDefault).map((p) => p.code)).toEqual(['premium']);

      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ isDefault: true }).expect(200);
      expect((await listPlans()).filter((p) => p.isDefault).map((p) => p.code)).toEqual(['standard']);
    });
  });

  describe('discount rules', () => {
    it('rejects invalid configurations', async () => {
      const standard = await defaultPlan();
      const post = (body: Record<string, unknown>) => ctx.http.post(DISCOUNTS).set(as(admin)).send(body);

      await post({ name: 'Их', type: 'percentage', value: 95, appliesToAll: true }).expect(400);
      await post({ name: 'Тэг', type: 'percentage', value: 0, appliesToAll: true }).expect(400);
      await post({ name: 'Сөрөг', type: 'fixed', value: -100, appliesToAll: true }).expect(400);
      await post({ name: 'Бутархай', type: 'percentage', value: 10.5, appliesToAll: true }).expect(400);
      await post({ name: 'Үнээс их', type: 'fixed', value: BASE, planIds: [standard.id] }).expect(400);
      await post({ name: 'Төлөвлөгөөгүй', type: 'percentage', value: 10 }).expect(400);
      await post({
        name: 'Огноо',
        type: 'percentage',
        value: 10,
        appliesToAll: true,
        startsAt: '2026-12-01T00:00:00.000Z',
        endsAt: '2026-11-01T00:00:00.000Z',
      }).expect(400);
      await post({ name: 'Үл мэдэгдэх', type: 'percentage', value: 10, planIds: ['64b64b64b64b64b64b64b64b'] }).expect(400);
      expect(await listDiscounts()).toHaveLength(0);
    });

    it('blocks a plan price change that would break a fixed discount', async () => {
      const standard = await defaultPlan();
      const fixed = await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: 'Тогтмол', type: 'fixed', value: 5000, planIds: [standard.id] })
        .expect(201);
      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ price: 5000 }).expect(400);
      expect((await defaultPlan()).price).toBe(BASE);
      await ctx.http.delete(`${DISCOUNTS}/${fixed.body.data.id}`).set(as(admin)).expect(200);
    });
  });

  describe('pricing flows into payments', () => {
    it('charges the full plan price when no discount applies', async () => {
      const res = await (await guestInvoice()).body.data;
      expect(res.amount).toBe(BASE);
      const stored = await trx(res.transactionId);
      expect(stored).toMatchObject({ amount: BASE, baseAmount: BASE, discountAmount: 0, planName: 'Төлөвлөгөө нээх' });
      expect(stored?.discountId).toBeUndefined();
    });

    it('applies the best live discount and records the breakdown', async () => {
      const standard = await defaultPlan();
      const ten = await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: '10% хямдрал', type: 'percentage', value: 10, appliesToAll: true })
        .expect(201);
      const fixed = await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: '3000₮ хямдрал', type: 'fixed', value: 3000, planIds: [standard.id] })
        .expect(201);

      expect((await defaultPlan()).finalPrice).toBe(BASE - 3000);

      const res = await guestInvoice();
      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(BASE - 3000);
      const stored = await trx(res.body.data.transactionId);
      expect(stored).toMatchObject({
        amount: BASE - 3000,
        baseAmount: BASE,
        discountAmount: 3000,
        discountName: '3000₮ хямдрал',
      });
      expect(String(stored?.discountId)).toBe(fixed.body.data.id);

      await ctx.http.delete(`${DISCOUNTS}/${fixed.body.data.id}`).set(as(admin)).expect(200);
      await ctx.http.patch(`${DISCOUNTS}/${ten.body.data.id}`).set(as(admin)).send({ isActive: false }).expect(200);
      expect((await guestInvoice()).body.data.amount).toBe(BASE);
      await ctx.http.delete(`${DISCOUNTS}/${ten.body.data.id}`).set(as(admin)).expect(200);
    });

    it('ignores scheduled and expired discounts', async () => {
      await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: 'Удахгүй', type: 'percentage', value: 50, appliesToAll: true, startsAt: '2999-01-01T00:00:00.000Z' })
        .expect(201);
      await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: 'Дууссан', type: 'percentage', value: 50, appliesToAll: true, endsAt: '2020-01-01T00:00:00.000Z' })
        .expect(201);
      const statuses = (await listDiscounts()).map((d) => d.status).sort();
      expect(statuses).toEqual(['expired', 'scheduled']);
      expect((await guestInvoice()).body.data.amount).toBe(BASE);
      const ids = (await listDiscounts()).map((d) => d.id);
      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids, action: 'delete' }).expect(200);
    });

    it('charges the plan a payer picks and rejects unknown or inactive plans', async () => {
      const premium = await planByCode('premium');
      const res = await guestInvoice({ planId: premium.id });
      expect(res.body.data.amount).toBe(45000);
      expect((await trx(res.body.data.transactionId))?.planName).toBe('Премиум+');

      await ctx.http.put(`${PLANS}/${premium.id}`).set(as(admin)).send({ isActive: false }).expect(200);
      expect((await guestInvoice({ planId: premium.id })).status).toBe(404);
      expect((await guestInvoice({ planId: 'nope' })).status).toBe(400);
      await ctx.http.put(`${PLANS}/${premium.id}`).set(as(admin)).send({ isActive: true }).expect(200);
    });

    it('re-prices a pending invoice after the admin changes the price', async () => {
      const email = 'repriced@example.test';
      const first = await ctx.http.post(INVOICE).send({ email }).expect(201);
      const again = await ctx.http.post(INVOICE).send({ email }).expect(201);
      expect(again.body.data.transactionId).toBe(first.body.data.transactionId);

      const standard = await defaultPlan();
      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ price: 25000 }).expect(200);
      const repriced = await ctx.http.post(INVOICE).send({ email }).expect(201);
      expect(repriced.body.data.amount).toBe(25000);
      expect(repriced.body.data.transactionId).not.toBe(first.body.data.transactionId);
      expect((await trx(first.body.data.transactionId))?.status).toBe(PaymentStatus.EXPIRED);

      await ctx.http.put(`${PLANS}/${standard.id}`).set(as(admin)).send({ price: BASE }).expect(200);
    });
  });

  describe('bulk discounts', () => {
    let ids: string[];
    let planIds: string[];

    beforeAll(async () => {
      const plans = await listPlans();
      planIds = plans.map((p) => p.id as string);
      const make = async (name: string, body: Record<string, unknown>): Promise<string> =>
        (await ctx.http.post(DISCOUNTS).set(as(admin)).send({ name, ...body }).expect(201)).body.data.id as string;
      ids = [
        await make('A', { type: 'percentage', value: 10, appliesToAll: true }),
        await make('B', { type: 'percentage', value: 20, planIds: [planIds[0]] }),
        await make('C', { type: 'fixed', value: 2000, planIds: [planIds[0]], isActive: false }),
      ];    });

    it('activates and deactivates many discounts in one request and reports unknown ids', async () => {
      const off = await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids: [...ids, '64b64b64b64b64b64b64b64b'], action: 'deactivate' })
        .expect(200);
      // `modified` counts the records the action was applied to (it also refreshes updatedAt on unchanged ones).
      expect(off.body.data).toMatchObject({ requested: 4, matched: 3, modified: 3, missingIds: ['64b64b64b64b64b64b64b64b'] });
      expect((await listDiscounts()).every((d) => d.isActive === false)).toBe(true);

      const on = await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids, action: 'activate' }).expect(200);
      expect(on.body.data).toMatchObject({ matched: 3, modified: 3 });
      expect((await listDiscounts()).every((d) => d.isActive === true)).toBe(true);
    });

    it('updates value and validity for many at once, all or nothing', async () => {
      const ok = await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids: [ids[0], ids[1]], action: 'update', value: 15, endsAt: '2999-12-31T00:00:00.000Z' })
        .expect(200);
      expect(ok.body.data.modified).toBe(2);
      const after = await listDiscounts();
      expect(after.find((d) => d.id === ids[0])).toMatchObject({ value: 15, endsAt: '2999-12-31T00:00:00.000Z' });
      expect(after.find((d) => d.id === ids[1])).toMatchObject({ value: 15 });
      expect(after.find((d) => d.id === ids[2])).toMatchObject({ value: 2000 });

      // 95% is invalid for the percentage ones; the fixed one is valid. Nothing may be written.
      const bad = await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids, action: 'update', value: 95 })
        .expect(400);
      expect(bad.body.error).toContain("'A'");
      expect(bad.body.error).toContain("'B'");
      const unchanged = await listDiscounts();
      expect(unchanged.find((d) => d.id === ids[0])?.value).toBe(15);
      expect(unchanged.find((d) => d.id === ids[2])?.value).toBe(2000);

      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids, action: 'update' }).expect(400);
    });

    it('clears dates with null and changes the plan scope for many discounts at once', async () => {
      await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids: [ids[0]], action: 'update', endsAt: null })
        .expect(200);
      expect((await listDiscounts()).find((d) => d.id === ids[0])?.endsAt).toBeNull();

      const premium = planIds[1] as string;
      await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids, action: 'update', planMode: 'add', planIds: [premium] })
        .expect(200);
      let current = await listDiscounts();
      expect(current.find((d) => d.id === ids[0])).toMatchObject({ appliesToAll: true });
      expect(current.find((d) => d.id === ids[1])?.planIds).toEqual(expect.arrayContaining([planIds[0], premium]));

      await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids, action: 'update', planMode: 'remove', planIds: [planIds[0]] })
        .expect(200);
      current = await listDiscounts();
      expect(current.find((d) => d.id === ids[0])).toMatchObject({ appliesToAll: false, planIds: [premium] });
      expect(current.find((d) => d.id === ids[1])?.planIds).toEqual([premium]);

      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids, action: 'update', planMode: 'all' }).expect(200);
      expect((await listDiscounts()).every((d) => d.appliesToAll === true && d.planIds.length === 0)).toBe(true);

      await ctx.http
        .post(`${DISCOUNTS}/bulk`)
        .set(as(admin))
        .send({ ids, action: 'update', planMode: 'set' })
        .expect(400);
    });

    it('deletes many discounts at once', async () => {
      const res = await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids, action: 'delete' }).expect(200);
      expect(res.body.data).toMatchObject({ matched: 3, deleted: 3 });
      expect(await listDiscounts()).toHaveLength(0);
    });

    it('validates the request itself', async () => {
      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids: [], action: 'delete' }).expect(400);
      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids: ['x'], action: 'delete' }).expect(400);
      await ctx.http.post(`${DISCOUNTS}/bulk`).set(as(admin)).send({ ids: [ids[0]], action: 'explode' }).expect(400);
    });
  });

  describe('bulk plans', () => {
    it('protects the default plan and detaches deleted plans from discounts', async () => {
      const extra = await Promise.all(
        ['team-a', 'team-b'].map(async (code) =>
          (await ctx.http.post(PLANS).set(as(admin)).send({ code, name: code, price: 30000 }).expect(201)).body.data.id as string,
        ),
      );
      const standard = await defaultPlan();

      const scoped = await ctx.http
        .post(DISCOUNTS)
        .set(as(admin))
        .send({ name: 'Зөвхөн A', type: 'percentage', value: 10, planIds: [extra[0]] })
        .expect(201);

      await ctx.http
        .post(`${PLANS}/bulk`)
        .set(as(admin))
        .send({ ids: [...extra, standard.id], action: 'deactivate' })
        .expect(409);
      await ctx.http
        .post(`${PLANS}/bulk`)
        .set(as(admin))
        .send({ ids: [standard.id], action: 'delete' })
        .expect(409);

      const off = await ctx.http.post(`${PLANS}/bulk`).set(as(admin)).send({ ids: extra, action: 'deactivate' }).expect(200);
      expect(off.body.data).toMatchObject({ matched: 2, modified: 2 });
      const on = await ctx.http.post(`${PLANS}/bulk`).set(as(admin)).send({ ids: extra, action: 'activate' }).expect(200);
      expect(on.body.data.modified).toBe(2);

      const del = await ctx.http.post(`${PLANS}/bulk`).set(as(admin)).send({ ids: extra, action: 'delete' }).expect(200);
      expect(del.body.data).toMatchObject({ matched: 2, deleted: 2 });
      expect((await listPlans()).some((p) => extra.includes(p.id))).toBe(false);

      // The discount was scoped only to a deleted plan: it must not widen to every plan.
      const orphan = (await listDiscounts()).find((d) => d.id === scoped.body.data.id);
      expect(orphan).toMatchObject({ appliesToAll: false, planIds: [], isActive: false, status: 'inactive' });
      expect((await guestInvoice()).body.data.amount).toBe(BASE);
    });
  });

  describe('payment settings', () => {
    it('reports the environment value, lets the dashboard override it, and can fall back', async () => {
      const initial = await ctx.http.get(SETTINGS).set(as(admin)).expect(200);
      expect(initial.body.data).toMatchObject({
        guestCheckoutEnabled: true,
        emailEnabled: false,
        sources: { guestCheckoutEnabled: 'environment', emailEnabled: 'environment' },
      });

      const off = await ctx.http.put(SETTINGS).set(as(admin)).send({ guestCheckoutEnabled: false }).expect(200);
      expect(off.body.data).toMatchObject({ guestCheckoutEnabled: false, sources: { guestCheckoutEnabled: 'dashboard' } });
      expect((await guestInvoice()).status).toBe(401);
      await ctx.http.post(INVOICE).set(as(member)).send({}).expect(201);

      const back = await ctx.http.put(SETTINGS).set(as(admin)).send({ guestCheckoutEnabled: null }).expect(200);
      expect(back.body.data).toMatchObject({ guestCheckoutEnabled: true, sources: { guestCheckoutEnabled: 'environment' } });
      expect((await guestInvoice()).status).toBe(201);

      await ctx.http.put(SETTINGS).set(as(admin)).send({ guestCheckoutEnabled: 'yes' }).expect(400);
    });
  });

  describe('bulk transactions', () => {
    it('re-checks, expires and refunds many transactions in single requests', async () => {
      const make = async (): Promise<{ id: string; invoiceId: string }> => {
        const res = await guestInvoice({ planSnapshot: { destinationName: `T${++guestCounter}`, grandTotalCost: guestCounter } });
        return { id: res.body.data.transactionId as string, invoiceId: res.body.data.qpayInvoice.invoiceId as string };
      };
      const [paid, unpaidA, unpaidB] = [await make(), await make(), await make()] as [
        { id: string; invoiceId: string },
        { id: string; invoiceId: string },
        { id: string; invoiceId: string },
      ];
      ctx.qpay.paid.add(paid.invoiceId);
      const ids = [paid.id, unpaidA.id, unpaidB.id];

      const recheck = await ctx.http.post(TRANSACTIONS_BULK).set(as(admin)).send({ ids, action: 'recheck' }).expect(200);
      expect(recheck.body.data).toMatchObject({ requested: 3, matched: 3, settled: 1, modified: 1, skipped: 0 });
      expect((await trx(paid.id))?.status).toBe(PaymentStatus.COMPLETED);

      const expire = await ctx.http
        .post(TRANSACTIONS_BULK)
        .set(as(admin))
        .send({ ids, action: 'expire-pending' })
        .expect(200);
      expect(expire.body.data).toMatchObject({ matched: 3, modified: 2, settled: 0, skipped: 1 });
      expect((await trx(unpaidA.id))?.status).toBe(PaymentStatus.EXPIRED);
      expect((await trx(paid.id))?.status).toBe(PaymentStatus.COMPLETED);

      const refund = await ctx.http
        .post(TRANSACTIONS_BULK)
        .set(as(admin))
        .send({ ids: [...ids, '64b64b64b64b64b64b64b64b'], action: 'mark-refunded' })
        .expect(200);
      expect(refund.body.data).toMatchObject({ matched: 3, modified: 1, skipped: 2, missingIds: ['64b64b64b64b64b64b64b64b'] });
      expect((await trx(paid.id))?.status).toBe(PaymentStatus.REFUNDED);
      expect((await trx(unpaidB.id))?.status).toBe(PaymentStatus.EXPIRED);
    });

    it('settles a payment that was made after the invoice went stale instead of expiring it', async () => {
      const res = await guestInvoice({ planSnapshot: { destinationName: 'Late', grandTotalCost: 1 } });
      ctx.qpay.paid.add(res.body.data.qpayInvoice.invoiceId as string);
      const expire = await ctx.http
        .post(TRANSACTIONS_BULK)
        .set(as(admin))
        .send({ ids: [res.body.data.transactionId], action: 'expire-pending' })
        .expect(200);
      expect(expire.body.data).toMatchObject({ settled: 1, modified: 0 });
      expect((await trx(res.body.data.transactionId))?.status).toBe(PaymentStatus.COMPLETED);
    });

    it('validates the request', async () => {
      await ctx.http.post(TRANSACTIONS_BULK).set(as(admin)).send({ ids: [], action: 'recheck' }).expect(400);
      await ctx.http.post(TRANSACTIONS_BULK).set(as(admin)).send({ ids: ['x'], action: 'recheck' }).expect(400);
      await ctx.http.post(TRANSACTIONS_BULK).set(as(admin)).send({ ids: ['64b64b64b64b64b64b64b64b'], action: 'x' }).expect(400);
    });
  });
});

