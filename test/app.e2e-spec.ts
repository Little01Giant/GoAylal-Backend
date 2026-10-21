import { UserRole } from '../src/modules/auth/schemas/user.schema.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext, type TestUser } from './helpers/test-app.js';

describe('App contract: envelope, auth guards, admin, pagination', () => {
  let ctx: TestContext;
  let user: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    user = await ctx.makeUser('user@example.test');
    admin = await ctx.makeUser(ADMIN_EMAIL, { role: UserRole.ADMIN });
  });
  afterAll(async () => ctx.close());

  describe('envelope', () => {
    it('GET /api/v1/health returns the success envelope', async () => {
      const res = await ctx.http.get('/api/v1/health').expect(200);
      expect(res.body).toMatchObject({ success: true, data: { status: 'ok', service: 'goaylal-backend' } });
    });

    it('unknown routes return the error envelope with a stable code', async () => {
      const res = await ctx.http.get('/api/v1/nope').expect(404);
      expect(res.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
      expect(typeof res.body.error).toBe('string');
    });

    it('validation errors use VALIDATION_FAILED', async () => {
      const res = await ctx.http.post('/api/v1/auth/google').send({}).expect(400);
      expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_FAILED' });
    });

    it('sets security headers and hides the framework', async () => {
      const res = await ctx.http.get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('rejects oversized bodies', async () => {
      await ctx.http.post('/api/v1/auth/google').send({ idToken: 'x'.repeat(400_000) }).expect(413);
    });
  });

  describe('authentication', () => {
    it('rejects missing, malformed and forged tokens with 401', async () => {
      await ctx.http.get('/api/v1/auth/me').expect(401);
      await ctx.http.get('/api/v1/auth/me').set('Authorization', 'Bearer not.a.jwt').expect(401);
      await ctx.http.get('/api/v1/auth/me').set('Authorization', 'Basic abc').expect(401);
    });

    it('GET /auth/me returns id (and the transitional _id), without internal fields', async () => {
      const res = await ctx.http.get('/api/v1/auth/me').set(bearer(user.token)).expect(200);
      expect(res.body.data).toMatchObject({ id: user.id, _id: user.id, email: user.email, role: 'user' });
      expect(res.body.data.googleId).toBeUndefined();
    });

    it('rejects a deactivated user immediately, not at token expiry', async () => {
      const inactive = await ctx.makeUser('inactive@example.test', { isActive: false });
      await ctx.http.get('/api/v1/auth/me').set(bearer(inactive.token)).expect(401);
    });
  });

  describe('admin authorization', () => {
    it('401 without a token, 403 for a normal user, 200 for an admin', async () => {
      await ctx.http.get('/api/v1/admin/stats').expect(401);
      await ctx.http.get('/api/v1/admin/stats').set(bearer(user.token)).expect(403);
      const res = await ctx.http.get('/api/v1/admin/stats').set(bearer(admin.token)).expect(200);
      expect(res.body.data).toMatchObject({ totalUsers: expect.any(Number), totalRevenue: expect.any(Number) });
    });

    it('reads the role from the database: a token minted as admin stops working after demotion', async () => {
      const second = await ctx.makeUser('second-admin@example.test', { role: UserRole.ADMIN });
      await ctx.http.get('/api/v1/admin/stats').set(bearer(second.token)).expect(200);
      await ctx.users.updateOne({ _id: second.id }, { role: UserRole.USER });
      await ctx.http.get('/api/v1/admin/stats').set(bearer(second.token)).expect(403);
    });

    it('does not accept the dev admin token unless explicitly enabled', async () => {
      await ctx.http.get('/api/v1/admin/stats').set(bearer('dev-admin-token')).expect(401);
    });

    it('protects every admin route', async () => {
      const routes: Array<[string, string]> = [
        ['get', '/api/v1/admin/transactions'],
        ['get', '/api/v1/admin/transactions/abc'],
        ['post', '/api/v1/admin/transactions/abc/recheck'],
        ['get', '/api/v1/admin/users'],
        ['patch', '/api/v1/admin/users/abc/role'],
        ['get', '/api/v1/admin/trips'],
        ['post', '/api/v1/admin/trips'],
        ['put', '/api/v1/admin/trips/abc'],
        ['delete', '/api/v1/admin/trips/abc'],
      ];
      for (const [method, path] of routes) {
        const res = await (ctx.http as unknown as Record<string, (p: string) => import('supertest').Test>)[method]!(path);
        expect(res.status, `${method} ${path} without token`).toBe(401);
        const asUser = await (ctx.http as unknown as Record<string, (p: string) => import('supertest').Test>)[method]!(path).set(
          bearer(user.token),
        );
        expect(asUser.status, `${method} ${path} as user`).toBe(403);
      }
    });

    it('never demotes the last admin or a configured admin email', async () => {
      const res = await ctx.http
        .patch(`/api/v1/admin/users/${admin.id}/role`)
        .set(bearer(admin.token))
        .send({ role: 'user' })
        .expect(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('promotes and returns { id, role }', async () => {
      const promoted = await ctx.makeUser('promote@example.test');
      const res = await ctx.http
        .patch(`/api/v1/admin/users/${promoted.id}/role`)
        .set(bearer(admin.token))
        .send({ role: 'admin' })
        .expect(200);
      expect(res.body.data).toMatchObject({ id: promoted.id, role: 'admin' });
    });
  });

  describe('pagination and search (admin lists)', () => {
    it('returns { items, total, page, totalPages } for transactions and users', async () => {
      for (const path of ['/api/v1/admin/transactions', '/api/v1/admin/users']) {
        const res = await ctx.http.get(path).set(bearer(admin.token)).expect(200);
        expect(res.body.data).toMatchObject({ items: expect.any(Array), total: expect.any(Number), page: 1, totalPages: 1 });
      }
    });

    it('rejects out-of-range or non-numeric paging instead of producing NaN queries', async () => {
      for (const query of ['page=0', 'limit=0', 'limit=101', 'limit=abc', 'page=-2', 'status=bogus']) {
        await ctx.http.get(`/api/v1/admin/transactions?${query}`).set(bearer(admin.token)).expect(400);
      }
      await ctx.http.get('/api/v1/admin/users?limit=100&page=1').set(bearer(admin.token)).expect(200);
    });

    it('treats search input as a literal, not a regular expression', async () => {
      await ctx.http.get('/api/v1/admin/users?search=' + encodeURIComponent('(((')).set(bearer(admin.token)).expect(200);
      const res = await ctx.http.get('/api/v1/admin/users?search=.*').set(bearer(admin.token)).expect(200);
      expect(res.body.data.total).toBe(0);
    });
  });

  describe('route table (everything the current frontend calls must exist)', () => {
    const FRONTEND_ROUTES = [
      'GET /api/v1/health',
      'GET /api/v1/destinations',
      'GET /api/v1/destinations/suggested-trips',
      'GET /api/v1/destinations/:key',
      'POST /api/v1/auth/google',
      'GET /api/v1/auth/me',
      'POST /api/v1/ai/chat',
      'POST /api/v1/itineraries',
      'GET /api/v1/itineraries/my',
      'GET /api/v1/itineraries/:id',
      'DELETE /api/v1/itineraries/:id',
      'PUT /api/v1/itineraries/:id/reorder-items',
      'POST /api/v1/payments/qpay/create-invoice',
      'POST /api/v1/payments/qpay/callback',
      'POST /api/v1/payments/verify/:transactionId',
      'GET /api/v1/payments/my',
      'GET /api/v1/payments/receipt/:transactionId',
      'GET /api/v1/admin/stats',
      'GET /api/v1/admin/transactions',
      'GET /api/v1/admin/transactions/:id',
      'POST /api/v1/admin/transactions/:id/recheck',
      'GET /api/v1/admin/users',
      'PATCH /api/v1/admin/users/:id/role',
      'GET /api/v1/admin/trips',
      'POST /api/v1/admin/trips',
      'PUT /api/v1/admin/trips/:id',
      'DELETE /api/v1/admin/trips/:id',
    ];

    it('registers each route with the expected method', () => {
      const instance = ctx.app.getHttpAdapter().getInstance() as {
        router?: { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> };
        _router?: { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> };
      };
      const stack = (instance.router ?? instance._router)?.stack ?? [];
      const registered = new Set(
        stack.flatMap((layer) =>
          layer.route ? Object.keys(layer.route.methods).map((m) => `${m.toUpperCase()} ${layer.route!.path}`) : [],
        ),
      );
      expect(registered.size).toBeGreaterThan(20);
      expect(FRONTEND_ROUTES.filter((r) => !registered.has(r))).toEqual([]);
    });

    it('keeps /destinations/suggested-trips ahead of /destinations/:key', async () => {
      const res = await ctx.http.get('/api/v1/destinations/suggested-trips').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
