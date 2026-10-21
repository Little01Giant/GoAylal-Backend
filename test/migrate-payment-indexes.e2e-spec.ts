import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const run = promisify(execFile);
const SCRIPT = 'dist/scripts/migrate-payment-indexes.js';

/** Exercises the compiled script, so it runs after `npm run build`. */
describe.skipIf(!existsSync(SCRIPT))('migrate-payment-indexes script', () => {
  let mongo: MongoMemoryServer;
  let uri: string;
  const trx = (n: number, status: string, dedupeKey?: string, minutesAgo = 0) => ({
    transactionNumber: `TRX-${n}`,
    invoiceNumber: `INV-${n}`,
    amount: 20000,
    status,
    ...(dedupeKey ? { dedupeKey } : {}),
    createdAt: new Date(Date.now() - minutesAgo * 60_000),
  });
  const exec = async (args: string[], env: Record<string, string> = {}) => {
    try {
      const { stdout } = await run(process.execPath, [SCRIPT, ...args], {
        env: { ...process.env, MONGODB_URI: uri, ...env },
      });
      return { code: 0, out: stdout };
    } catch (err) {
      const e = err as { code?: number; stdout?: string; stderr?: string };
      return { code: e.code ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri('migrate-test');
  });
  afterAll(async () => mongo.stop());

  beforeEach(async () => {
    const conn = await mongoose.createConnection(uri).asPromise();
    const col = conn.collection('payment_transactions');
    await col.drop().catch(() => undefined);
    // No unique index exists yet, so duplicate pending invoices can be inserted.
    await col.insertMany([
      trx(1, 'pending', 'u:alice|plan', 1),
      trx(2, 'pending', 'u:alice|plan', 5),
      trx(3, 'pending', 'u:alice|plan', 9),
      trx(4, 'pending', 'g:bob|plan', 2),
      trx(5, 'pending', undefined, 120),
      trx(6, 'completed', 'u:alice|plan', 50),
    ]);
    await conn.close();
  });

  const state = async () => {
    const conn = await mongoose.createConnection(uri).asPromise();
    const col = conn.collection('payment_transactions');
    const docs = await col.find().sort({ transactionNumber: 1 }).toArray();
    const indexes = (await col.indexes()).map((i) => i.name);
    await conn.close();
    return { docs, indexes };
  };

  it('defaults to a dry run: reports duplicates and writes nothing', async () => {
    const { code, out } = await exec([]);
    expect(code).toBe(0);
    expect(out).toContain('DRY RUN');
    expect(out).toContain('Duplicate pending groups: 1 (2 surplus invoices would be expired)');
    expect(out).toContain('Legacy pending invoices without a dedupe key (informational, left untouched): 1');
    const { docs, indexes } = await state();
    expect(docs.map((d) => d.status)).toEqual(['pending', 'pending', 'pending', 'pending', 'pending', 'completed']);
    expect(indexes).not.toContain('uniq_pending_dedupe_key');
  });

  it('--apply expires only the surplus duplicates (newest kept), deletes nothing and builds the index', async () => {
    const { code, out } = await exec(['--apply']);
    expect(code).toBe(0);
    expect(out).toContain('Expired 2 surplus pending invoices.');
    const { docs, indexes } = await state();
    expect(docs).toHaveLength(6);
    expect(docs.map((d) => d.status)).toEqual(['pending', 'expired', 'expired', 'pending', 'pending', 'completed']);
    expect(indexes).toContain('uniq_pending_dedupe_key');
  });

  it('refuses to modify production without both explicit flags', async () => {
    const refused = await exec(['--apply'], { NODE_ENV: 'production' });
    expect(refused.code).toBe(1);
    expect(refused.out).toContain('--allow-production');
    expect((await state()).docs.map((d) => d.status)).toEqual(['pending', 'pending', 'pending', 'pending', 'pending', 'completed']);

    const half = await exec(['--apply', '--allow-production'], { NODE_ENV: 'production' });
    expect(half.code).toBe(1);

    const dry = await exec([], { NODE_ENV: 'production' });
    expect(dry.code).toBe(0);
  });
});
