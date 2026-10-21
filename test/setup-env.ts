import { randomBytes } from 'node:crypto';

// AppModule validates the environment when it is first imported, so a valid test-only
// configuration must exist before any test file loads it. Real values are set per app in createTestApp.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('hex');

// Never let a developer's shell leak real provider credentials into tests.
for (const key of ['DEEPSEEK_API_KEY', 'QPAY_CLIENT_ID', 'QPAY_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET']) {
  delete process.env[key];
}
