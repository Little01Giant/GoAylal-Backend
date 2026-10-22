import { randomBytes } from 'node:crypto';
import { validateEnv } from './env.validation.js';

const strongSecret = (): string => randomBytes(32).toString('hex');

const productionEnv = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  NODE_ENV: 'production',
  JWT_SECRET: strongSecret(),
  MONGODB_URI: 'mongodb+srv://example.invalid/goaylal',
  GOOGLE_CLIENT_ID: 'client-id',
  QPAY_CLIENT_ID: 'id',
  QPAY_CLIENT_SECRET: 'secret',
  QPAY_INVOICE_CODE: 'code',
  QPAY_CALLBACK_URL: 'https://api.example.invalid/api/v1/payments/qpay/callback',
  GUEST_CHECKOUT_ENABLED: 'false',
  ...overrides,
});

describe('validateEnv', () => {
  it('accepts a complete production environment', () => {
    expect(() => validateEnv(productionEnv())).not.toThrow();
  });

  it('requires JWT_SECRET in every environment, including development and test', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(/JWT_SECRET is required/);
    expect(() => validateEnv({ NODE_ENV: 'test' })).toThrow(/JWT_SECRET is required/);
    expect(() => validateEnv({})).toThrow(/JWT_SECRET is required/);
  });

  it('accepts an explicit random secret outside production', () => {
    expect(() => validateEnv({ NODE_ENV: 'test', JWT_SECRET: strongSecret() })).not.toThrow();
  });

  it('rejects short secrets, stricter in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'development', JWT_SECRET: 'short' })).toThrow(/at least 16/);
    expect(() => validateEnv(productionEnv({ JWT_SECRET: 'a1b2c3d4e5f6a7b8' }))).toThrow(/at least 32/);
  });

  it('rejects repetitive and placeholder secrets', () => {
    expect(() => validateEnv(productionEnv({ JWT_SECRET: 'a'.repeat(48) }))).toThrow(/repetitive/);
    expect(() => validateEnv(productionEnv({ JWT_SECRET: 'your_jwt_secret_goes_here_0123456789abcdef' }))).toThrow(
      /placeholder/,
    );
  });

  it('requires production-only settings', () => {
    const env = productionEnv({ MONGODB_URI: undefined, GOOGLE_CLIENT_ID: '', QPAY_CLIENT_SECRET: '' });
    expect(() => validateEnv(env)).toThrow(/MONGODB_URI[\s\S]*GOOGLE_CLIENT_ID[\s\S]*QPAY_CLIENT_SECRET/);
  });

  it('accepts DATABASE_URI as the alias for MONGODB_URI in production', () => {
    const env = productionEnv({ MONGODB_URI: undefined, DATABASE_URI: 'mongodb+srv://example.invalid/goaylal' });
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('refuses mock QPay and the dev admin token in production', () => {
    expect(() => validateEnv(productionEnv({ QPAY_MOCK: 'true' }))).toThrow(/QPAY_MOCK/);
    expect(() => validateEnv(productionEnv({ ALLOW_DEV_ADMIN_TOKEN: 'true' }))).toThrow(/ALLOW_DEV_ADMIN_TOKEN/);
  });

  it('requires GUEST_CHECKOUT_ENABLED to be set explicitly in production', () => {
    expect(() => validateEnv(productionEnv({ GUEST_CHECKOUT_ENABLED: undefined }))).toThrow(/GUEST_CHECKOUT_ENABLED/);
    expect(() => validateEnv(productionEnv({ GUEST_CHECKOUT_ENABLED: 'maybe' }))).toThrow(/GUEST_CHECKOUT_ENABLED/);
    expect(() => validateEnv(productionEnv({ GUEST_CHECKOUT_ENABLED: 'true' }))).not.toThrow();
  });

  it('validates NODE_ENV, the fee and the port', () => {
    const base = { JWT_SECRET: strongSecret() };
    expect(() => validateEnv({ ...base, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
    expect(() => validateEnv({ ...base, UNLOCK_FEE_MNT: '0' })).toThrow(/UNLOCK_FEE_MNT/);
    expect(() => validateEnv({ ...base, UNLOCK_FEE_MNT: '20000.5' })).toThrow(/UNLOCK_FEE_MNT/);
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...base, UNLOCK_FEE_MNT: '20000', PORT: '4000' })).not.toThrow();
  });

  it('reports every problem at once', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET[\s\S]*MONGODB_URI[\s\S]*QPAY_CLIENT_ID/);
  });
});
