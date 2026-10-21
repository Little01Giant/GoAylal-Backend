/**
 * Prepares the payment_transactions collection for the partial unique "one pending invoice per
 * payer and plan" index and builds the schema's indexes.
 *
 *   node dist/scripts/migrate-payment-indexes.js                 dry run (default): report only, no writes
 *   node dist/scripts/migrate-payment-indexes.js --apply         expire duplicate pending invoices, build indexes
 *   ... --apply --allow-production --confirm-backup              required together when NODE_ENV=production
 *
 * It never deletes documents. It only moves surplus duplicate pending invoices to `expired` and creates indexes.
 */
import mongoose from 'mongoose';
import {
  PaymentStatus,
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../modules/payments/schemas/payment-transaction.schema.js';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const isProduction = process.env.NODE_ENV === 'production';

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file: rely on the process environment.
  }

  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URI;
  if (!uri) {
    throw new Error('MONGODB_URI (or DATABASE_URI) is not set');
  }
  if (apply && isProduction && !(args.has('--allow-production') && args.has('--confirm-backup'))) {
    throw new Error('Refusing to modify production without --allow-production and --confirm-backup');
  }

  await mongoose.connect(uri, { autoIndex: false });
  const model = mongoose.model(PaymentTransaction.name, PaymentTransactionSchema);
  log(`Mode: ${apply ? 'APPLY' : 'DRY RUN (no changes will be written)'}${isProduction ? ' [production]' : ''}`);

  const duplicates = await model
    .aggregate<{ _id: string; ids: mongoose.Types.ObjectId[]; created: Date[] }>([
      { $match: { status: PaymentStatus.PENDING, dedupeKey: { $exists: true } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$dedupeKey', ids: { $push: '$_id' }, created: { $push: '$createdAt' } } },
      { $match: { 'ids.1': { $exists: true } } },
    ])
    .option({ allowDiskUse: true });

  const surplus = duplicates.flatMap((group) => group.ids.slice(1));
  log(`Duplicate pending groups: ${duplicates.length} (${surplus.length} surplus invoices would be expired)`);
  for (const group of duplicates) {
    log(`  - ${group._id.slice(0, 24)}…  keep ${group.ids[0]}  expire ${group.ids.slice(1).join(', ')}`);
  }

  const legacyPending = await model.countDocuments({ status: PaymentStatus.PENDING, dedupeKey: { $exists: false } });
  log(`Legacy pending invoices without a dedupe key (informational, left untouched): ${legacyPending}`);

  const existingIndexes = (await model.collection.indexes().catch(() => [])).map((i) => i.name);
  const wanted = model.schema.indexes().map(([, options]) => options?.name).filter((n): n is string => !!n);
  log(`Existing indexes: ${existingIndexes.join(', ') || '(none)'}`);
  log(`Named indexes the schema will create: ${wanted.join(', ') || '(unnamed field indexes only)'}`);

  if (!apply) {
    log('Dry run complete. Re-run with --apply to make these changes.');
    return;
  }

  if (surplus.length > 0) {
    const result = await model.updateMany(
      { _id: { $in: surplus }, status: PaymentStatus.PENDING },
      { $set: { status: PaymentStatus.EXPIRED } },
    );
    log(`Expired ${result.modifiedCount} surplus pending invoices.`);
  }
  await model.createIndexes();
  log('Indexes built.');
}

try {
  await main();
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
