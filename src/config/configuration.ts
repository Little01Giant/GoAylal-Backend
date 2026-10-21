export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  database: {
    uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/goaylal',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'goaylal_jwt_super_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  qpay: {
    baseUrl: process.env.QPAY_BASE_URL ?? 'https://merchant.qpay.mn/v2',
    clientId: process.env.QPAY_CLIENT_ID ?? '',
    clientSecret: process.env.QPAY_CLIENT_SECRET ?? '',
    invoiceCode: process.env.QPAY_INVOICE_CODE ?? 'GO_AYLAL_INVOICE',
    callbackUrl: process.env.QPAY_CALLBACK_URL ?? '',
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
});
