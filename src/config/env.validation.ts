const NODE_ENVS = ['development', 'test', 'production'] as const;
const MIN_SECRET_LENGTH_PRODUCTION = 32;
const MIN_SECRET_LENGTH_OTHER = 16;
const MIN_DISTINCT_SECRET_CHARS = 10;

type EnvInput = Record<string, unknown>;

function text(env: EnvInput, key: string): string {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function isTruthy(value: unknown): boolean {
  return typeof value === 'string' && ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}

/** A signing secret must be explicit, long enough and not a trivially repetitive or placeholder value. */
function secretProblem(secret: string, isProduction: boolean): string | null {
  const minLength = isProduction ? MIN_SECRET_LENGTH_PRODUCTION : MIN_SECRET_LENGTH_OTHER;
  if (secret.length < minLength) {
    return `JWT_SECRET must be set to at least ${minLength} characters`;
  }
  if (new Set(secret).size < MIN_DISTINCT_SECRET_CHARS) {
    return 'JWT_SECRET is too repetitive to be a secure signing key';
  }
  if (/^(your_|change|example|placeholder|test_?secret)/i.test(secret)) {
    return 'JWT_SECRET looks like a placeholder; generate a random value';
  }
  return null;
}

/**
 * Fails fast on a misconfigured environment. JWT_SECRET has no default in any environment;
 * development reads it from .env and tests must provide their own value.
 */
export function validateEnv(env: EnvInput): EnvInput {
  const errors: string[] = [];
  const nodeEnv = text(env, 'NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';

  if (!(NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of ${NODE_ENVS.join(', ')} (got "${nodeEnv}")`);
  }

  const jwtSecret = text(env, 'JWT_SECRET');
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else {
    const problem = secretProblem(jwtSecret, isProduction);
    if (problem) {
      errors.push(problem);
    }
  }

  const fee = text(env, 'UNLOCK_FEE_MNT');
  if (fee && !/^[1-9]\d{0,8}$/.test(fee)) {
    errors.push('UNLOCK_FEE_MNT must be a positive integer (MNT)');
  }

  const port = text(env, 'PORT');
  if (port && !/^\d{1,5}$/.test(port)) {
    errors.push('PORT must be a number');
  }

  if (isProduction) {
    if (!text(env, 'MONGODB_URI') && !text(env, 'DATABASE_URI')) {
      errors.push('MONGODB_URI (or its alias DATABASE_URI) is required in production');
    }
    if (!text(env, 'GOOGLE_CLIENT_ID')) {
      errors.push('GOOGLE_CLIENT_ID is required in production');
    }
    if (isTruthy(env.QPAY_MOCK)) {
      errors.push('QPAY_MOCK must not be enabled in production');
    }
    if (isTruthy(env.RATE_LIMIT_DISABLED)) {
      errors.push('RATE_LIMIT_DISABLED must not be enabled in production');
    }
    if (isTruthy(env.ALLOW_DEV_ADMIN_TOKEN)) {
      errors.push('ALLOW_DEV_ADMIN_TOKEN must not be enabled in production');
    }
    // Guest checkout defaults to on; production must opt in or out explicitly so it is never left on by accident.
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(text(env, 'GUEST_CHECKOUT_ENABLED').toLowerCase())) {
      errors.push('GUEST_CHECKOUT_ENABLED must be set explicitly (true or false) in production');
    }
    for (const key of ['QPAY_CLIENT_ID', 'QPAY_CLIENT_SECRET', 'QPAY_INVOICE_CODE', 'QPAY_CALLBACK_URL']) {
      if (!text(env, key)) {
        errors.push(`${key} is required in production`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }
  return env;
}
