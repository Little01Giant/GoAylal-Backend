import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'node:crypto';
import { Model, Types } from 'mongoose';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  PaymentStatus,
  PaymentMethod,
} from './schemas/payment-transaction.schema.js';
import { Counter, CounterDocument } from './schemas/counter.schema.js';
import { Itinerary, ItineraryDocument, ItineraryStatus } from '../itineraries/schemas/itinerary.schema.js';
import { CreateQPayInvoiceDto } from './dto/create-qpay-invoice.dto.js';
import { ItineraryEmailService } from './itinerary-email.service.js';
import { PaymentSettingsService } from './payment-settings.service.js';
import { QPayClient, type QPayBankUrl } from './qpay/qpay.client.js';
import { PricingService, type PriceQuote } from '../pricing/pricing.service.js';
import { sanitizePlanSnapshot } from './plan-snapshot.js';
import { isDuplicateKeyError } from '../../common/utils/is-duplicate-key-error.js';
import { UserRole } from '../auth/schemas/user.schema.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

/** A pending invoice older than this is re-checked with QPay and then expired instead of being reused. */
const INVOICE_REUSE_WINDOW_MS = 15 * 60 * 1000;
/** Reference numbers are numbered per calendar day in Ulaanbaatar time (UTC+8). */
const ULAANBAATAR_OFFSET_MS = 8 * 60 * 60 * 1000;
const HISTORY_LIMIT = 100;
/** QPay is an external call, so a bulk re-check runs a few at a time rather than all at once. */
const RECHECK_CONCURRENCY = 5;
const DEFAULT_TITLE = 'GoAylal аяллын бүрэн төлөвлөгөө';

export interface QPayInvoiceResult {
  readonly transactionId: Types.ObjectId | string;
  readonly transactionNumber: string;
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly currency: string;
  readonly qpayInvoice: {
    readonly invoiceId: string;
    readonly qrText: string;
    readonly qrImage: string;
    readonly qPayShortUrl: string;
    readonly urls: readonly QPayBankUrl[];
  };
}

export interface PaymentHistoryItemDto {
  readonly id: string;
  readonly transactionNumber: string;
  readonly invoiceNumber: string;
  readonly title: string;
  readonly destinationName: string;
  readonly paymentMethod: string;
  readonly paymentMethodLabel: string;
  readonly bankName: string;
  readonly paidAt: string;
  readonly amount: number;
  readonly status: string;
  readonly statusLabel: string;
  readonly items: unknown[];
  readonly planSnapshot?: Record<string, unknown> | undefined;
}

export interface PaymentVerificationResult {
  readonly verified: boolean;
  readonly transactionNumber: string;
  readonly status: string;
}

export interface BulkTransactionsResult {
  readonly requested: number;
  readonly matched: number;
  /** Transactions whose status this action changed (settled / expired / refunded). */
  readonly modified: number;
  /** Transactions found to be paid at QPay and completed during this action. */
  readonly settled: number;
  /** Found but not eligible for the action (e.g. already completed), left untouched. */
  readonly skipped: number;
  readonly missingIds: readonly string[];
}

const STATUS_LABELS: Readonly<Record<PaymentStatus, string>> = {
  [PaymentStatus.PENDING]: 'Хүлээгдэж буй',
  [PaymentStatus.COMPLETED]: 'Амжилттай',
  [PaymentStatus.FAILED]: 'Амжилтгүй',
  [PaymentStatus.EXPIRED]: 'Хугацаа дууссан',
  [PaymentStatus.REFUNDED]: 'Буцаагдсан',
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(Itinerary.name)
    private readonly itineraryModel: Model<ItineraryDocument>,
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
    private readonly qpay: QPayClient,
    private readonly emailService: ItineraryEmailService,
    private readonly pricing: PricingService,
    private readonly settings: PaymentSettingsService,
  ) {}

  /** Atomic, instance-safe reference numbers: TRX-2026-1021-0001 / INV-2026-1021-0001. */
  private async nextReferences(): Promise<{ transactionNumber: string; invoiceNumber: string }> {
    const day = new Date(Date.now() + ULAANBAATAR_OFFSET_MS).toISOString().slice(0, 10);
    const counter = await this.counterModel
      .findOneAndUpdate({ _id: `payment-${day}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' })
      .lean()
      .exec();
    const suffix = `${day.slice(0, 4)}-${day.slice(5, 7)}${day.slice(8, 10)}-${String(counter?.seq ?? 1).padStart(4, '0')}`;
    return { transactionNumber: `TRX-${suffix}`, invoiceNumber: `INV-${suffix}` };
  }

  /**
   * Creates the unlock-fee invoice. The amount is always the server-side price of the chosen (or default)
   * pricing plan after its best live discount. Authenticated payers are tied to their own itinerary;
   * guests are allowed only while guest checkout is enabled (dashboard setting, else GUEST_CHECKOUT_ENABLED).
   */
  async createQPayInvoice(dto: CreateQPayInvoiceDto, user?: AuthenticatedUser): Promise<QPayInvoiceResult> {
    if (!user && !(await this.settings.getEffective()).guestCheckoutEnabled) {
      throw new UnauthorizedException('Төлбөр хийхийн тулд нэвтэрсэн байх шаардлагатай.');
    }

    const email = (dto.email ?? user?.email)?.toLowerCase();
    if (!email) {
      throw new BadRequestException('Имэйл хаяг шаардлагатай.');
    }

    const itinerary = user ? await this.findPayableItinerary(dto.itineraryId, user) : null;
    const planSnapshot = sanitizePlanSnapshot(dto.planSnapshot);
    const planHash = sha256(JSON.stringify(planSnapshot ?? {}));
    const dedupeKey = user
      ? `u:${user.sub}|${itinerary?._id.toString() ?? planHash}`
      : `g:${email}|${planHash}`;

    const quote = await this.pricing.quote(dto.planId);
    const reusable = await this.reuseOrExpirePending(dedupeKey, quote);
    if (reusable) {
      return this.toInvoiceResult(reusable);
    }

    const amount = quote.finalPrice;
    const title = dto.title?.trim() || DEFAULT_TITLE;
    const { transactionNumber, invoiceNumber } = await this.nextReferences();
    const invoice = await this.qpay.createInvoice({
      invoiceNumber,
      amount,
      description: `${title} (${amount.toLocaleString('en-US')}₮)`,
    });

    try {
      const transaction = await this.paymentModel.create({
        transactionNumber,
        invoiceNumber,
        itineraryId: itinerary?._id,
        userId: user ? new Types.ObjectId(user.sub) : undefined,
        amount,
        planId: new Types.ObjectId(quote.planId),
        planName: quote.planName,
        planDurationDays: quote.durationDays,
        baseAmount: quote.basePrice,
        discountAmount: quote.discountAmount,
        discountId: quote.discountId ? new Types.ObjectId(quote.discountId) : undefined,
        discountName: quote.discountName ?? undefined,
        currency: 'MNT',
        method: PaymentMethod.QPAY,
        status: PaymentStatus.PENDING,
        dedupeKey,
        qpayInvoiceId: invoice.invoiceId,
        qpayQrText: invoice.qrText,
        qpayQrImage: invoice.qrImage,
        qpayShortUrl: invoice.shortUrl,
        qpayUrls: [...invoice.urls],
        items: [{ name: title, quantity: 1, unitPrice: amount, totalPrice: amount }],
        customerEmail: email,
        planSnapshot: planSnapshot ? { ...planSnapshot, invoiceNumber, transactionNumber } : undefined,
      });
      return this.toInvoiceResult(transaction);
    } catch (err) {
      if (!isDuplicateKeyError(err)) {
        throw err;
      }
      // A concurrent request created the pending invoice for this payer and plan first.
      const winner = await this.paymentModel.findOne({ dedupeKey, status: PaymentStatus.PENDING });
      if (winner) {
        return this.toInvoiceResult(winner);
      }
      throw new ConflictException('Нэхэмжлэх үүсгэх үед давхцал гарлаа. Дахин оролдоно уу.');
    }
  }

  /**
   * Verifies (and if paid, settles) a payment. Settlement only ever follows QPay's own confirmation;
   * `simulate` is honoured solely in QPAY_MOCK mode, which is impossible in production.
   */
  async verifyPayment(identifier: string, options: { simulate?: boolean } = {}): Promise<PaymentVerificationResult> {
    const transaction = await this.findTransaction(identifier);
    if (!transaction) {
      throw new NotFoundException('Гүйлгээ олдсонгүй.');
    }
    return this.verifyTransaction(transaction, options.simulate === true);
  }

  /** QPay webhook: the body is never trusted, the payment is re-checked with QPay. */
  async handleCallback(paymentId: string | undefined): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    const transaction = paymentId ? await this.findTransaction(paymentId) : null;
    if (!transaction) {
      throw new NotFoundException('Харгалзах гүйлгээ олдсонгүй.');
    }
    const result = await this.verifyTransaction(transaction, false);
    return { received: true, verified: result.verified, transactionNumber: result.transactionNumber };
  }

  /** Re-checks every selected pending payment with QPay (a few at a time) and settles the paid ones. */
  async recheckMany(ids: readonly string[]): Promise<BulkTransactionsResult> {
    const { transactions, missingIds } = await this.loadByIds(ids);
    const pending = transactions.filter((t) => t.status === PaymentStatus.PENDING);
    const settled = (await this.verifyInChunks(pending)).filter((r) => r.verified).length;
    return {
      requested: ids.length,
      matched: transactions.length,
      modified: settled,
      settled,
      skipped: transactions.length - pending.length,
      missingIds,
    };
  }

  /**
   * Closes stale pending invoices. Each is re-checked with QPay first, so a payment made after the modal
   * closed is settled instead of expired; only the still-unpaid ones become `expired`, in one write.
   */
  async expirePendingMany(ids: readonly string[]): Promise<BulkTransactionsResult> {
    const { transactions, missingIds } = await this.loadByIds(ids);
    const pending = transactions.filter((t) => t.status === PaymentStatus.PENDING);
    const results = await this.verifyInChunks(pending);
    const settled = results.filter((r) => r.verified).length;
    const unpaid = pending.filter((_, index) => results[index]?.verified !== true).map((t) => t._id as Types.ObjectId);

    const res =
      unpaid.length > 0
        ? await this.paymentModel
            .updateMany({ _id: { $in: unpaid }, status: PaymentStatus.PENDING }, { $set: { status: PaymentStatus.EXPIRED } })
            .exec()
        : null;
    const modified = res?.modifiedCount ?? 0;
    return {
      requested: ids.length,
      matched: transactions.length,
      modified,
      settled,
      skipped: transactions.length - settled - modified,
      missingIds,
    };
  }

  /** Records a manual refund. It only marks the payment: money is returned through QPay/the bank by support. */
  async markRefundedMany(ids: readonly string[]): Promise<BulkTransactionsResult> {
    const { transactions, missingIds } = await this.loadByIds(ids);
    const res = await this.paymentModel
      .updateMany(
        { _id: { $in: transactions.map((t) => t._id) }, status: PaymentStatus.COMPLETED },
        { $set: { status: PaymentStatus.REFUNDED } },
      )
      .exec();
    return {
      requested: ids.length,
      matched: transactions.length,
      modified: res.modifiedCount,
      settled: 0,
      skipped: transactions.length - res.modifiedCount,
      missingIds,
    };
  }

  private async loadByIds(
    ids: readonly string[],
  ): Promise<{ transactions: PaymentTransactionDocument[]; missingIds: string[] }> {
    const transactions = await this.paymentModel
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .exec();
    const present = new Set(transactions.map((t) => String(t._id)));
    return { transactions, missingIds: ids.filter((id) => !present.has(id)) };
  }

  /** Verifies in the order given, `RECHECK_CONCURRENCY` at a time. */
  private async verifyInChunks(
    transactions: readonly PaymentTransactionDocument[],
  ): Promise<PaymentVerificationResult[]> {
    const results: PaymentVerificationResult[] = [];
    for (let start = 0; start < transactions.length; start += RECHECK_CONCURRENCY) {
      const chunk = transactions.slice(start, start + RECHECK_CONCURRENCY);
      results.push(...(await Promise.all(chunk.map((t) => this.verifyTransaction(t, false)))));
    }
    return results;
  }

  async findUserPayments(user: AuthenticatedUser): Promise<PaymentHistoryItemDto[]> {
    await this.claimGuestPayments(user);
    const docs = await this.paymentModel
      .find({ userId: new Types.ObjectId(user.sub) })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean()
      .exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      transactionNumber: doc.transactionNumber,
      invoiceNumber: doc.invoiceNumber,
      title: doc.items?.[0]?.name ?? 'GoAylal аяллын захиалга',
      destinationName: (doc.planSnapshot?.destinationName as string | undefined) ?? 'GoAylal аялал',
      paymentMethod: doc.method,
      paymentMethodLabel: 'QPay (QR код)',
      bankName: 'Хаан Банк / QPay',
      paidAt: new Date(doc.paidAt ?? doc.createdAt ?? Date.now()).toLocaleString('mn-MN'),
      amount: doc.amount,
      status: doc.status,
      statusLabel: STATUS_LABELS[doc.status],
      items: doc.items ?? [],
      planSnapshot: doc.planSnapshot,
    }));
  }

  /** Receipt for the payer (or an admin). Anyone else gets 404 so existence is not disclosed. */
  async getReceipt(identifier: string, user: AuthenticatedUser): Promise<PaymentTransaction & { _id: Types.ObjectId }> {
    await this.claimGuestPayments(user);
    const transaction = await this.findTransaction(identifier, true);
    const isOwner = transaction?.userId?.toString() === user.sub;
    if (!transaction || (!isOwner && user.role !== UserRole.ADMIN)) {
      throw new NotFoundException('Төлбөрийн баримт олдсонгүй.');
    }
    return transaction as PaymentTransaction & { _id: Types.ObjectId };
  }

  /**
   * A guest payment is linked to an account only when the account's verified Google email matches
   * the payment email, and only for completed payments. The update is idempotent.
   */
  private async claimGuestPayments(user: AuthenticatedUser): Promise<void> {
    await this.paymentModel.updateMany(
      { userId: { $exists: false }, customerEmail: user.email.toLowerCase(), status: PaymentStatus.COMPLETED },
      { $set: { userId: new Types.ObjectId(user.sub) } },
    );
  }

  private async findPayableItinerary(
    itineraryId: string | undefined,
    user: AuthenticatedUser,
  ): Promise<ItineraryDocument | null> {
    // Placeholder ids such as "itn-temp" from an unsaved plan are simply "no itinerary".
    if (!itineraryId || !Types.ObjectId.isValid(itineraryId)) {
      return null;
    }
    const itinerary = await this.itineraryModel.findById(itineraryId);
    if (!itinerary || itinerary.userId?.toString() !== user.sub) {
      throw new NotFoundException('Аяллын хөтөлбөр олдсонгүй.');
    }
    if (itinerary.status === ItineraryStatus.UNLOCKED) {
      throw new ConflictException('Энэ хөтөлбөр аль хэдийн нээгдсэн байна.');
    }
    return itinerary;
  }

  private async findTransaction(identifier: string, lean = false): Promise<PaymentTransactionDocument | null> {
    const filter = Types.ObjectId.isValid(identifier)
      ? { _id: new Types.ObjectId(identifier) }
      : { $or: [{ transactionNumber: identifier }, { invoiceNumber: identifier }, { qpayInvoiceId: identifier }] };
    const query = this.paymentModel.findOne(filter);
    return lean ? ((await query.lean().exec()) as PaymentTransactionDocument | null) : query.exec();
  }

  private async verifyTransaction(
    transaction: PaymentTransactionDocument,
    simulate: boolean,
  ): Promise<PaymentVerificationResult> {
    if (transaction.status === PaymentStatus.PENDING) {
      const paid =
        (simulate && this.qpay.isMock) ||
        (!!transaction.qpayInvoiceId && (await this.qpay.isInvoicePaid(transaction.qpayInvoiceId, transaction.amount)));
      if (paid) {
        const settled = await this.settle(transaction._id as Types.ObjectId);
        const current = settled ?? (await this.paymentModel.findById(transaction._id));
        return this.toVerification(current ?? transaction);
      }
    }
    return this.toVerification(transaction);
  }

  /**
   * The single place a payment becomes completed. The conditional update makes it atomic and
   * one-way: concurrent verify/callback/recheck calls produce exactly one transition and one set
   * of side effects. Returns null when another caller already settled (or the state is terminal).
   */
  private async settle(transactionId: Types.ObjectId): Promise<PaymentTransactionDocument | null> {
    const settled = await this.paymentModel.findOneAndUpdate(
      { _id: transactionId, status: PaymentStatus.PENDING },
      { $set: { status: PaymentStatus.COMPLETED, paidAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (settled) {
      this.logger.log(`Payment ${settled.transactionNumber} settled`);
      await this.afterSettlement(settled);
    }
    return settled;
  }

  private async afterSettlement(transaction: PaymentTransactionDocument): Promise<void> {
    if (transaction.itineraryId) {
      await this.itineraryModel.updateOne(
        { _id: transaction.itineraryId, status: { $in: [ItineraryStatus.DRAFT, ItineraryStatus.SAVED] } },
        { $set: { status: ItineraryStatus.UNLOCKED } },
      );
    }

    if ((await this.settings.getEffective()).emailEnabled && transaction.customerEmail) {
      const snapshot = transaction.planSnapshot ?? {};
      try {
        await this.emailService.sendItineraryEmail({
          toEmail: transaction.customerEmail,
          planTitle: transaction.items[0]?.name ?? DEFAULT_TITLE,
          destinationName: String(snapshot.destinationName ?? ''),
          daysCount: Number(snapshot.daysCount ?? 0),
          nightsCount: Number(snapshot.nightsCount ?? 0),
          travelersCount: Number(snapshot.travelersCount ?? 1),
          roomsCount: Number(snapshot.roomsCount ?? 1),
          grandTotalCost: Number(snapshot.grandTotalCost ?? 0),
          invoiceNumber: transaction.invoiceNumber,
          transactionNumber: transaction.transactionNumber,
        });
      } catch (err) {
        this.logger.error(`Itinerary email failed for ${transaction.transactionNumber}: ${String(err)}`);
      }
    }
  }

  /**
   * Returns a pending invoice that can be handed back to the payer. A stale one is first re-checked
   * with QPay (the payer may have paid after the modal closed): if paid it is settled and returned,
   * otherwise it is expired so a fresh invoice can be created.
   */
  private async reuseOrExpirePending(dedupeKey: string, quote: PriceQuote): Promise<PaymentTransactionDocument | null> {
    const pending = await this.paymentModel.findOne({ dedupeKey, status: PaymentStatus.PENDING });
    if (!pending) {
      return null;
    }
    // An invoice is also stale once the plan or its price changed (the admin edited pricing since).
    const sameQuote = pending.amount === quote.finalPrice && String(pending.planId ?? '') === quote.planId;
    const age = Date.now() - (pending.createdAt?.getTime() ?? 0);
    if (age < INVOICE_REUSE_WINDOW_MS && sameQuote) {
      return pending;
    }
    const result = await this.verifyTransaction(pending, false);
    if (result.verified) {
      return this.paymentModel.findById(pending._id);
    }
    await this.paymentModel.updateOne(
      { _id: pending._id, status: PaymentStatus.PENDING },
      { $set: { status: PaymentStatus.EXPIRED } },
    );
    return null;
  }

  private toVerification(transaction: PaymentTransactionDocument): PaymentVerificationResult {
    return {
      verified: transaction.status === PaymentStatus.COMPLETED,
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
    };
  }

  private toInvoiceResult(transaction: PaymentTransactionDocument): QPayInvoiceResult {
    return {
      transactionId: transaction._id as Types.ObjectId,
      transactionNumber: transaction.transactionNumber,
      invoiceNumber: transaction.invoiceNumber,
      amount: transaction.amount,
      currency: transaction.currency,
      qpayInvoice: {
        invoiceId: transaction.qpayInvoiceId ?? '',
        qrText: transaction.qpayQrText ?? '',
        qrImage: transaction.qpayQrImage ?? '',
        qPayShortUrl: transaction.qpayShortUrl ?? '',
        urls: transaction.qpayUrls ?? [],
      },
    };
  }
}
