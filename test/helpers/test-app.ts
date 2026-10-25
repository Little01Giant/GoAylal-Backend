import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/common/configure-app.js';
import { Itinerary, type ItineraryDocument } from '../../src/modules/itineraries/schemas/itinerary.schema.js';
import { ItineraryEmailService } from '../../src/modules/payments/itinerary-email.service.js';
import { QPayClient, type CreateQPayInvoiceInput, type QPayInvoice } from '../../src/modules/payments/qpay/qpay.client.js';
import {
  PaymentTransaction,
  type PaymentTransactionDocument,
} from '../../src/modules/payments/schemas/payment-transaction.schema.js';
import { User, UserRole, type UserDocument } from '../../src/modules/auth/schemas/user.schema.js';

const MANAGED_ENV = [
  'NODE_ENV',
  'JWT_SECRET',
  'MONGODB_URI',
  'DATABASE_URI',
  'ADMIN_EMAILS',
  'GUEST_CHECKOUT_ENABLED',
  'PAYMENT_EMAIL_ENABLED',
  'UNLOCK_FEE_MNT',
  'QPAY_MOCK',
  'ALLOW_DEV_ADMIN_TOKEN',
  'GOOGLE_CLIENT_ID',
  'RATE_LIMIT_DISABLED',
  'QPAY_STATUS_CHECK_INTERVAL_S',
] as const;

export const ADMIN_EMAIL = 'admin@example.test';

/** Stand-in for the QPay HTTP client: paid invoices are controlled by the test. */
export class FakeQPay {
  readonly paid = new Set<string>();
  /** Invoices cancelled at QPay (`DELETE /invoice/{id}`). */
  readonly cancelled = new Set<string>();
  invoicesCreated = 0;
  /** How many times QPay was asked whether an invoice is paid. */
  checks = 0;
  isMock = false;

  async createInvoice(input: CreateQPayInvoiceInput): Promise<QPayInvoice> {
    this.invoicesCreated += 1;
    return {
      invoiceId: `QP-${input.invoiceNumber}`,
      qrText: 'qr-text',
      qrImage: 'qr-image',
      shortUrl: 'https://qpay.invalid/short',
      urls: [{ name: 'Bank', description: 'Bank app', logo: 'logo', link: 'bank://pay' }],
    };
  }

  async isInvoicePaid(invoiceId: string): Promise<boolean> {
    this.checks += 1;
    return this.paid.has(invoiceId);
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    this.cancelled.add(invoiceId);
    return true;
  }
}

export class FakeEmail {
  sent = 0;
  async sendItineraryEmail(): Promise<{ success: boolean }> {
    this.sent += 1;
    return { success: true };
  }
}

export interface TestUser {
  readonly id: string;
  readonly email: string;
  readonly token: string;
}

export interface TestContext {
  readonly app: INestApplication;
  readonly http: ReturnType<typeof request>;
  readonly qpay: FakeQPay;
  readonly email: FakeEmail;
  readonly users: Model<UserDocument>;
  readonly itineraries: Model<ItineraryDocument>;
  readonly payments: Model<PaymentTransactionDocument>;
  readonly jwtSecret: string;
  makeUser(email: string, options?: { role?: UserRole; isActive?: boolean }): Promise<TestUser>;
  close(): Promise<void>;
}

/** Boots the real AppModule on an in-memory MongoDB with QPay and email replaced by fakes. */
export async function createTestApp(env: Partial<Record<(typeof MANAGED_ENV)[number], string>> = {}): Promise<TestContext> {
  const mongo = await MongoMemoryServer.create();
  const jwtSecret = randomBytes(32).toString('hex');

  for (const key of MANAGED_ENV) {
    delete process.env[key];
  }
  Object.assign(process.env, {
    NODE_ENV: 'test',
    JWT_SECRET: jwtSecret,
    MONGODB_URI: mongo.getUri('goaylal-test'),
    ADMIN_EMAILS: ADMIN_EMAIL,
    // Most suites make many calls from one client; the rate-limit suite re-enables it explicitly.
    RATE_LIMIT_DISABLED: 'true',
    ...env,
  });

  const qpay = new FakeQPay();
  const email = new FakeEmail();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(QPayClient)
    .useValue(qpay)
    .overrideProvider(ItineraryEmailService)
    .useValue(email)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const jwt = app.get(JwtService);

  return {
    app,
    http: request(app.getHttpServer()),
    qpay,
    email,
    users,
    itineraries: app.get<Model<ItineraryDocument>>(getModelToken(Itinerary.name)),
    payments: app.get<Model<PaymentTransactionDocument>>(getModelToken(PaymentTransaction.name)),
    jwtSecret,
    async makeUser(userEmail, options = {}) {
      const role = options.role ?? UserRole.USER;
      // Upsert: configured ADMIN_EMAILS accounts already exist after startup.
      const user = await users.findOneAndUpdate(
        { email: userEmail },
        { $set: { name: userEmail.split('@')[0], role, isActive: options.isActive ?? true } },
        { upsert: true, returnDocument: 'after' },
      );
      const id = user._id.toString();
      return { id, email: userEmail, token: await jwt.signAsync({ sub: id, email: userEmail, role }) };
    },
    async close() {
      await app.close();
      await mongo.stop();
    },
  };
}

export const bearer = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });
