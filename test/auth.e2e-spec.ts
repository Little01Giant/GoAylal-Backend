import { vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { ADMIN_EMAIL, bearer, createTestApp, type TestContext } from './helpers/test-app.js';

interface GoogleClientStub {
  verifyIdToken: (args: { idToken: string; audience?: string }) => Promise<{ getPayload: () => unknown }>;
}

describe('Auth: Google login', () => {
  let ctx: TestContext;
  let auth: AuthService;

  /** Replaces only the network call to Google; the service's own verification rules still run. */
  const stubGoogle = (payload: Record<string, unknown> | null) => {
    const client = (auth as unknown as { googleClient: GoogleClientStub }).googleClient;
    return vi.spyOn(client, 'verifyIdToken').mockImplementation(async () => {
      if (!payload) throw new Error('invalid token');
      return { getPayload: () => payload };
    });
  };
  const login = (body: Record<string, unknown> = { idToken: 'token' }) => ctx.http.post('/api/v1/auth/google').send(body);

  beforeAll(async () => {
    ctx = await createTestApp({ GOOGLE_CLIENT_ID: 'test-client-id.apps.example' });
    auth = ctx.app.get(AuthService);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => ctx.close());

  it('creates the user from the verified token claims and ignores client-supplied name and image', async () => {
    const spy = stubGoogle({ email: 'New.User@Example.test', email_verified: true, sub: 'g-1', name: 'Real Name', picture: 'https://img.example/real.png' });
    const res = await login({ idToken: 'token', name: 'Hacker', image: 'https://evil.example/x.png' }).expect(200);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ idToken: 'token', audience: 'test-client-id.apps.example' }));
    expect(res.body.data.user).toMatchObject({ email: 'new.user@example.test', name: 'Real Name', image: 'https://img.example/real.png', role: 'user' });
    expect(res.body.data.user.id).toBeDefined();

    const me = await ctx.http.get('/api/v1/auth/me').set(bearer(res.body.data.accessToken)).expect(200);
    expect(me.body.data.id).toBe(res.body.data.user.id);
  });

  it('is idempotent for the same Google identity', async () => {
    stubGoogle({ email: 'repeat@example.test', email_verified: true, sub: 'g-2', name: 'Repeat' });
    const first = await login().expect(200);
    const second = await login().expect(200);
    expect(second.body.data.user.id).toBe(first.body.data.user.id);
    expect(await ctx.users.countDocuments({ email: 'repeat@example.test' })).toBe(1);
  });

  it('rejects unverified emails, invalid tokens and tokens without a subject', async () => {
    stubGoogle({ email: 'unverified@example.test', email_verified: false, sub: 'g-3' });
    await login().expect(401);
    stubGoogle({ email: 'nosub@example.test', email_verified: true });
    await login().expect(401);
    stubGoogle(null);
    await login().expect(401);
    expect(await ctx.users.countDocuments({ email: { $in: ['unverified@example.test', 'nosub@example.test'] } })).toBe(0);
  });

  it('never falls back to an unauthenticated tokeninfo call when verification fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    stubGoogle(null);
    await login().expect(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses to hand an existing email to a different Google identity', async () => {
    stubGoogle({ email: 'owner@example.test', email_verified: true, sub: 'g-owner' });
    await login().expect(200);
    stubGoogle({ email: 'owner@example.test', email_verified: true, sub: 'g-attacker' });
    const res = await login().expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('promotes only addresses listed in ADMIN_EMAILS', async () => {
    stubGoogle({ email: ADMIN_EMAIL, email_verified: true, sub: 'g-admin', name: 'Admin' });
    const admin = await login().expect(200);
    expect(admin.body.data.user.role).toBe('admin');
    await ctx.http.get('/api/v1/admin/stats').set(bearer(admin.body.data.accessToken)).expect(200);

    stubGoogle({ email: 'ordinary@example.test', email_verified: true, sub: 'g-ordinary' });
    const ordinary = await login().expect(200);
    expect(ordinary.body.data.user.role).toBe('user');
  });

  it('blocks deactivated accounts at login', async () => {
    stubGoogle({ email: 'blocked@example.test', email_verified: true, sub: 'g-blocked' });
    await login().expect(200);
    await ctx.users.updateOne({ email: 'blocked@example.test' }, { isActive: false });
    const res = await login().expect(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
