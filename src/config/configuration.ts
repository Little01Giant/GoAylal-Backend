import { isTruthy } from './env.validation.js';

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/goaylal';
const DEFAULT_UNLOCK_FEE_MNT = 20000;

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);
}

/**
 * Canonical environment contract. `MONGODB_URI` wins over its alias `DATABASE_URI`
 * (used by the deployment guide). The AI provider is DeepSeek via The Hive (`DEEPSEEK_*`).
 * `JWT_SECRET` has no default; `validateEnv` rejects a missing or weak value before this runs.
 */
export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  return {
    port: parseInt(process.env.PORT ?? '4000', 10),
    nodeEnv,
    isProduction,
    trustProxy: parseInt(process.env.TRUST_PROXY ?? '0', 10),
    corsOrigins: isProduction
      ? corsOrigins
      : [...new Set([...corsOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000'])],
    database: {
      uri: process.env.MONGODB_URI ?? process.env.DATABASE_URI ?? DEFAULT_MONGO_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    },
    qpay: {
      baseUrl: process.env.QPAY_BASE_URL ?? 'https://merchant.qpay.mn/v2',
      clientId: process.env.QPAY_CLIENT_ID ?? '',
      clientSecret: process.env.QPAY_CLIENT_SECRET ?? '',
      invoiceCode: process.env.QPAY_INVOICE_CODE ?? 'GO_AYLAL_INVOICE',
      callbackUrl: process.env.QPAY_CALLBACK_URL ?? 'http://localhost:4000/api/v1/payments/qpay/callback',
      mock: !isProduction && isTruthy(process.env.QPAY_MOCK),
      // QPay forbids checking payments repeatedly: payment/check is only for after its callback. So the dialog's
      // status poll never asks QPay by default (0). A positive value turns on a slow safety-net check.
      statusCheckIntervalSeconds: parseInt(process.env.QPAY_STATUS_CHECK_INTERVAL_S ?? '0', 10),
    },
    pricing: {
      unlockFeeMnt: parseInt(process.env.UNLOCK_FEE_MNT ?? String(DEFAULT_UNLOCK_FEE_MNT), 10),
    },
    admin: {
      emails: list(process.env.ADMIN_EMAILS ?? 'munkhuu.munkhsaihan01@gmail.com'),
      devToken: !isProduction && isTruthy(process.env.ALLOW_DEV_ADMIN_TOKEN),
    },
    // Test/dev escape hatch only; validateEnv rejects it in production.
    rateLimit: {
      enabled: isProduction || !isTruthy(process.env.RATE_LIMIT_DISABLED),
    },
    payments: {
      // Transitional: lets the current frontend pay without logging in. Remove once the frontend gates login.
      guestCheckoutEnabled:
        process.env.GUEST_CHECKOUT_ENABLED === undefined ? true : isTruthy(process.env.GUEST_CHECKOUT_ENABLED),
      emailEnabled: isTruthy(process.env.PAYMENT_EMAIL_ENABLED),
    },
    seed: {
      onBoot: process.env.SEED_ON_BOOT === undefined ? !isProduction : isTruthy(process.env.SEED_ON_BOOT),
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api-cdn.thehive.ai/api/v3',
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-ai/deepseek-v4.1-flash-1017',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    smtp: {
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? '',
    },
  };
};
