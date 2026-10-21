import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';

/** Monotonic counter to prevent invoice number collisions within the same millisecond */
let invoiceCounter = 0;
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  PaymentStatus,
  PaymentMethod,
} from './schemas/payment-transaction.schema.js';
import { Itinerary, ItineraryDocument } from '../itineraries/schemas/itinerary.schema.js';
import { CreateQPayInvoiceDto } from './dto/create-qpay-invoice.dto.js';

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
    readonly urls: readonly {
      readonly name: string;
      readonly description: string;
      readonly logo: string;
      readonly link: string;
    }[];
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

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    @InjectModel(PaymentTransaction.name)
    private readonly paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(Itinerary.name)
    private readonly itineraryModel: Model<ItineraryDocument>,
    private readonly configService: ConfigService,
  ) {}

  /** Generate a collision-safe invoice/transaction number using timestamp + counter */
  private generateUniqueRef(prefix: 'INV' | 'TRX'): string {
    const ts = Date.now().toString(36).toUpperCase();
    const seq = (++invoiceCounter % 10000).toString().padStart(4, '0');
    return `${prefix}-${ts}-${seq}`;
  }

  /**
   * QPay v2 Bearer Token авах
   */
  async getQPayToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now) {
      return this.cachedToken;
    }

    const baseUrl = this.configService.get<string>('qpay.baseUrl') ?? 'https://merchant.qpay.mn/v2';
    const clientId = this.configService.get<string>('qpay.clientId') ?? '';
    const clientSecret = this.configService.get<string>('qpay.clientSecret') ?? '';

    if (!clientId || !clientSecret) {
      this.cachedToken = 'mock_qpay_token_' + now;
      this.tokenExpiresAt = now + 3600 * 1000;
      return this.cachedToken;
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch(`${baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`QPay auth failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = (await response.json()) as { access_token?: string; expires_in?: number };
      const token = data.access_token ?? 'dev_token';
      this.cachedToken = token;
      this.tokenExpiresAt = now + ((data.expires_in ?? 3600) - 60) * 1000;
      return token;
    } catch (err) {
      console.error('[QPay auth error]:', err);
      return 'dev_token';
    }
  }

  /**
   * QPay нэхэмжлэх үүсгэх (Төлөвлөгөө нээх хураамж: 20,000₮)
   */
  async createQPayInvoice(
    payload: string | CreateQPayInvoiceDto,
    userIdParam?: string,
  ): Promise<QPayInvoiceResult> {
    const itineraryId = typeof payload === 'string' ? payload : payload.itineraryId;
    const userId = typeof payload === 'object' ? payload.userId : userIdParam;
    const email = typeof payload === 'object' ? payload.email : undefined;
    const title =
      typeof payload === 'object' && payload.title
        ? payload.title
        : 'GoAylal - Бээжин хотын аяллын хөтөлбөр & төлөвлөгөө';
    // Per user test requirement: "тооцоолох төлбөрийг 20000 аас 100 болго"
    const totalAmount = typeof payload === 'object' && payload.amount ? payload.amount : 100;
    const planSnapshot = typeof payload === 'object' ? payload.planSnapshot : undefined;

    let itinerary = null;
    if (itineraryId && Types.ObjectId.isValid(itineraryId)) {
      itinerary = await this.itineraryModel.findById(itineraryId);
    }

    // 1. Сүүлийн 15 минутад үүссэн, төлөгдөөгүй идэвхтэй нэхэмжлэх байгаа эсэхийг шалгах (Давхардаж олон үүсэхээс сэргийлнэ)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existingFilter: Record<string, unknown> = {
      status: PaymentStatus.PENDING,
      amount: totalAmount,
      qpayInvoiceId: { $exists: true, $ne: '' },
      createdAt: { $gte: fifteenMinutesAgo },
    };

    if (itinerary?._id) {
      existingFilter.itineraryId = itinerary._id;
    } else if (email) {
      existingFilter.customerEmail = email;
    }

    const existingPending = await this.paymentModel
      .findOne(existingFilter)
      .sort({ createdAt: -1 })
      .exec();

    if (
      existingPending &&
      existingPending.qpayInvoiceId &&
      !existingPending.qpayInvoiceId.startsWith('QPAY-') &&
      existingPending.qpayQrImage
    ) {
      return {
        transactionId: existingPending._id,
        transactionNumber: existingPending.transactionNumber,
        invoiceNumber: existingPending.invoiceNumber,
        amount: existingPending.amount,
        currency: existingPending.currency,
        qpayInvoice: {
          invoiceId: existingPending.qpayInvoiceId,
          qrText: existingPending.qpayQrText ?? '',
          qrImage: existingPending.qpayQrImage ?? '',
          qPayShortUrl: existingPending.qpayShortUrl ?? '',
          urls:
            existingPending.qpayUrls && existingPending.qpayUrls.length > 0
              ? existingPending.qpayUrls
              : [],
        },
      };
    }

    const invoiceNumber = this.generateUniqueRef('INV');
    const transactionNumber = this.generateUniqueRef('TRX');

    // QPay v2 API parameters
    const baseUrl = this.configService.get<string>('qpay.baseUrl') ?? 'https://merchant.qpay.mn/v2';
    const invoiceCode = this.configService.get<string>('qpay.invoiceCode') ?? 'GO_AYLAL_INVOICE';
    const callbackUrl =
      this.configService.get<string>('qpay.callbackUrl') ??
      'http://localhost:4000/api/v1/payments/qpay/callback';

    let qpayInvoiceId = `QPAY-${Date.now()}`;
    let qrText = `00020101021229300016qpay.mn0108${qpayInvoiceId}5406${totalAmount}5802MN6304`;
    let qrImage = '';
    let shortUrl = `https://qpay.mn/q/${qpayInvoiceId}`;
    let bankUrls: Array<{ name: string; description: string; logo: string; link: string }> = [];

    try {
      const token = await this.getQPayToken();
      if (token && token !== 'dev_token') {
        const qpayResponse = await fetch(`${baseUrl}/invoice`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoice_code: invoiceCode,
            sender_invoice_no: invoiceNumber,
            invoice_receiver_code: 'terminal',
            invoice_description: `${title} (${totalAmount.toLocaleString()}₮)`,
            amount: totalAmount,
            callback_url: callbackUrl,
          }),
        });

        if (qpayResponse.ok) {
          const qpayData = (await qpayResponse.json()) as {
            invoice_id?: string;
            qr_text?: string;
            qr_image?: string;
            qPay_shortUrl?: string;
            urls?: Array<{ name: string; description: string; logo: string; link: string }>;
          };

          if (qpayData.invoice_id) {
            qpayInvoiceId = qpayData.invoice_id;
            qrText = qpayData.qr_text ?? qrText;
            qrImage = qpayData.qr_image ?? '';
            shortUrl = qpayData.qPay_shortUrl ?? shortUrl;
            if (Array.isArray(qpayData.urls) && qpayData.urls.length > 0) {
              bankUrls = qpayData.urls;
            }
          }
        } else {
          const errText = await qpayResponse.text();
          console.error('[QPay createInvoice HTTP error]:', qpayResponse.status, errText);
        }
      }
    } catch (err) {
      console.error('[QPay createInvoice network error]:', err);
    }

    // Default fallback bank URLs if API returned empty
    if (bankUrls.length === 0) {
      bankUrls = [
        {
          name: 'Хаан Банк',
          description: 'Khan Bank App',
          logo: 'https://qpay.mn/banks/khan.png',
          link: qrText ? `khanbank://q?qPay_QRcode=${qrText}` : 'https://www.khanbank.com',
        },
        {
          name: 'Голомт Банк (SocialPay)',
          description: 'SocialPay App',
          logo: 'https://qpay.mn/banks/golomt.png',
          link: qrText ? `socialpay://q?qPay_QRcode=${qrText}` : 'https://www.golomtbank.com',
        },
        {
          name: 'М Банк',
          description: 'M Bank App',
          logo: 'https://qpay.mn/banks/mbank.png',
          link: qrText ? `mbank://q?qPay_QRcode=${qrText}` : 'https://m-bank.mn',
        },
        {
          name: 'Худалдаа Хөгжлийн Банк',
          description: 'TDB Online',
          logo: 'https://qpay.mn/banks/tdb.png',
          link: qrText ? `tdbbank://q?qPay_QRcode=${qrText}` : 'https://www.tdbm.mn',
        },
      ];
    }

    const receiptItems = [
      {
        name: title,
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount,
      },
    ];

    const transaction = await this.paymentModel.create({
      transactionNumber,
      invoiceNumber,
      itineraryId: itinerary?._id ?? new Types.ObjectId(),
      userId: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      amount: totalAmount,
      currency: 'MNT',
      method: PaymentMethod.QPAY,
      status: PaymentStatus.PENDING,
      qpayInvoiceId,
      qpayQrText: qrText,
      qpayQrImage: qrImage,
      qpayShortUrl: shortUrl,
      qpayUrls: bankUrls,
      items: receiptItems,
      customerEmail: email,
      planSnapshot,
    });

    return {
      transactionId: transaction._id,
      transactionNumber: transaction.transactionNumber,
      invoiceNumber: transaction.invoiceNumber,
      amount: transaction.amount,
      currency: transaction.currency,
      qpayInvoice: {
        invoiceId: qpayInvoiceId,
        qrText,
        qrImage,
        qPayShortUrl: shortUrl,
        urls: bankUrls,
      },
    };
  }

  /**
   * QPay Webhook буюу төлбөр баталгаажуулах
   */
  async handleCallback(paymentId: string): Promise<{ verified: boolean; transactionNumber: string }> {
    const transaction = await this.paymentModel.findOne({ qpayInvoiceId: paymentId });
    if (!transaction) {
      throw new NotFoundException('Харгалзах гүйлгээ олдсонгүй.');
    }

    // Idempotency: already completed — skip duplicate processing
    if (transaction.status === PaymentStatus.COMPLETED) {
      return { verified: true, transactionNumber: transaction.transactionNumber };
    }

    transaction.status = PaymentStatus.COMPLETED;
    transaction.paidAt = new Date();
    await transaction.save();

    // User requirement: Do NOT send PDF or email. Persist budget snapshot on transaction/user.
    // await this.dispatchItineraryEmail(transaction);

    return { verified: true, transactionNumber: transaction.transactionNumber };
  }

  /**
   * Төлбөр шалгах, баталгаажуулах
   */
  async verifyPayment(transactionId: string, simulate = false): Promise<PaymentVerificationResult> {
    let transaction = null;
    if (Types.ObjectId.isValid(transactionId)) {
      transaction = await this.paymentModel.findById(transactionId);
    }
    if (!transaction) {
      transaction = await this.paymentModel.findOne({
        $or: [{ qpayInvoiceId: transactionId }, { transactionNumber: transactionId }],
      });
    }

    if (!transaction) {
      throw new NotFoundException('Гүйлгээ олдсонгүй.');
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      return {
        verified: true,
        transactionNumber: transaction.transactionNumber,
        status: transaction.status,
      };
    }

    let isPaidViaQPay = false;
    if (transaction.qpayInvoiceId && !transaction.qpayInvoiceId.startsWith('QPAY-')) {
      try {
        const token = await this.getQPayToken();
        const baseUrl = this.configService.get<string>('qpay.baseUrl') ?? 'https://merchant.qpay.mn/v2';
        const checkRes = await fetch(`${baseUrl}/payment/check`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            object_type: 'INVOICE',
            object_id: transaction.qpayInvoiceId,
            offset: {
              page_number: 1,
              page_limit: 10,
            },
          }),
        });

        if (checkRes.ok) {
          const checkData = (await checkRes.json()) as { count?: number; rows?: unknown[] };
          if (typeof checkData.count === 'number' && checkData.count > 0) {
            isPaidViaQPay = true;
          }
        }
      } catch (err) {
        console.error('[QPay payment check error]:', err);
      }
    }

    if (isPaidViaQPay || simulate) {
      transaction.status = PaymentStatus.COMPLETED;
      transaction.paidAt = new Date();
      await transaction.save();

      this.logger.log(`Payment verified for ${transaction.transactionNumber}. Budget snapshot persisted.`);

      return {
        verified: true,
        transactionNumber: transaction.transactionNumber,
        status: transaction.status,
      };
    }

    return {
      verified: false,
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
    };
  }

  /**
   * Хэрэглэгчийн гүйлгээний түүх авах
   */
  async findUserPayments(userId?: string): Promise<PaymentHistoryItemDto[]> {
    const filter: Record<string, unknown> = {};
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.userId = new Types.ObjectId(userId);
    }

    const docs = await this.paymentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
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
      paidAt: doc.paidAt
        ? new Date(doc.paidAt).toLocaleString('mn-MN')
        : doc.createdAt
        ? new Date(doc.createdAt).toLocaleString('mn-MN')
        : new Date().toLocaleString('mn-MN'),
      amount: doc.amount,
      status: doc.status,
      statusLabel: doc.status === PaymentStatus.COMPLETED ? 'Амжилттай' : 'Хүлээгдэж буй',
      items: doc.items || [],
      planSnapshot: doc.planSnapshot,
    }));
  }

  /**
   * Төлбөрийн баримт (Receipt) дуудах
   */
  async getReceipt(transactionId: string): Promise<PaymentTransaction & { _id: Types.ObjectId }> {
    let transaction: (PaymentTransaction & { _id: Types.ObjectId }) | null = null;
    if (Types.ObjectId.isValid(transactionId)) {
      transaction = (await this.paymentModel.findById(transactionId).lean().exec()) as
        | (PaymentTransaction & { _id: Types.ObjectId })
        | null;
    }
    if (!transaction) {
      transaction = (await this.paymentModel
        .findOne({
          $or: [
            { transactionNumber: transactionId },
            { invoiceNumber: transactionId },
            { qpayInvoiceId: transactionId },
          ],
        })
        .lean()
        .exec()) as (PaymentTransaction & { _id: Types.ObjectId }) | null;
    }
    if (!transaction) {
      throw new NotFoundException('Төлбөрийн баримт олдсонгүй.');
    }
    return transaction;
  }
}
