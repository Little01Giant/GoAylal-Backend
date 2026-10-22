import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildInvoiceCallbackUrl } from './qpay-callback-url.js';

export interface QPayBankUrl {
  readonly name: string;
  readonly description: string;
  readonly logo: string;
  readonly link: string;
}

export interface QPayInvoice {
  readonly invoiceId: string;
  readonly qrText: string;
  readonly qrImage: string;
  readonly shortUrl: string;
  readonly urls: readonly QPayBankUrl[];
}

export interface CreateQPayInvoiceInput {
  readonly invoiceNumber: string;
  readonly amount: number;
  readonly description: string;
}

interface QPayCheckRow {
  readonly payment_status?: string;
  readonly payment_amount?: number | string;
}

const TOKEN_REFRESH_MARGIN_S = 60;

/**
 * Thin QPay v2 HTTP client. Real credentials are required unless QPAY_MOCK=true (never in production),
 * in which case invoices are fake and can only be settled through the explicit simulate path.
 */
@Injectable()
export class QPayClient {
  private readonly logger = new Logger(QPayClient.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {}

  get isMock(): boolean {
    return this.configService.get<boolean>('qpay.mock') === true;
  }

  async createInvoice(input: CreateQPayInvoiceInput): Promise<QPayInvoice> {
    if (this.isMock) {
      return this.mockInvoice(input);
    }

    const token = await this.getToken();
    const response = await this.post('invoice', token, {
      invoice_code: this.configService.get<string>('qpay.invoiceCode'),
      sender_invoice_no: input.invoiceNumber,
      invoice_receiver_code: 'terminal',
      invoice_description: input.description,
      amount: input.amount,
      callback_url: buildInvoiceCallbackUrl(
        this.configService.get<string>('qpay.callbackUrl') ?? '',
        input.invoiceNumber,
      ),
    });

    const data = (await response.json()) as {
      invoice_id?: string;
      qr_text?: string;
      qr_image?: string;
      qPay_shortUrl?: string;
      urls?: QPayBankUrl[];
    };
    if (!data.invoice_id) {
      this.logger.error('QPay invoice response did not contain an invoice_id');
      throw new ServiceUnavailableException('QPay нэхэмжлэх үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.');
    }
    return {
      invoiceId: data.invoice_id,
      qrText: data.qr_text ?? '',
      qrImage: data.qr_image ?? '',
      shortUrl: data.qPay_shortUrl ?? '',
      urls: Array.isArray(data.urls) ? data.urls : [],
    };
  }

  /**
   * Cancels an unpaid invoice at QPay (`DELETE /invoice/{invoice_id}`) so it can no longer be paid after we
   * gave up on it. Best effort: a failure is logged and reported as false, never thrown.
   */
  async cancelInvoice(invoiceId: string): Promise<boolean> {
    if (this.isMock) {
      return true;
    }
    try {
      const token = await this.getToken();
      const baseUrl = this.configService.getOrThrow<string>('qpay.baseUrl');
      const response = await fetch(`${baseUrl}/invoice/${encodeURIComponent(invoiceId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        this.logger.warn(`QPay invoice cancel returned ${response.status}`);
      }
      return response.ok;
    } catch (err) {
      this.logger.warn(`QPay invoice cancel failed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  /** True only when QPay itself reports a paid payment for this invoice covering the expected amount. */
  async isInvoicePaid(invoiceId: string, expectedAmount: number): Promise<boolean> {
    if (this.isMock) {
      return false;
    }
    try {
      const token = await this.getToken();
      const response = await this.post('payment/check', token, {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: { page_number: 1, page_limit: 10 },
      });
      const data = (await response.json()) as { count?: number; rows?: QPayCheckRow[] };
      if (typeof data.count !== 'number' || data.count <= 0 || !Array.isArray(data.rows)) {
        return false;
      }
      return data.rows.some((row) => {
        const statusOk = row.payment_status === undefined || row.payment_status === 'PAID';
        const amount = row.payment_amount === undefined ? undefined : Number(row.payment_amount);
        return statusOk && (amount === undefined || Number.isNaN(amount) || amount >= expectedAmount);
      });
    } catch (err) {
      this.logger.warn(`QPay payment check failed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now) {
      return this.cachedToken;
    }

    const clientId = this.configService.get<string>('qpay.clientId') ?? '';
    const clientSecret = this.configService.get<string>('qpay.clientSecret') ?? '';
    if (!clientId || !clientSecret) {
      this.logger.error('QPay credentials are not configured');
      throw new ServiceUnavailableException('Төлбөрийн үйлчилгээ одоогоор тохируулагдаагүй байна.');
    }

    const baseUrl = this.configService.getOrThrow<string>('qpay.baseUrl');
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      this.logger.error(`QPay auth network error: ${err instanceof Error ? err.message : String(err)}`);
      throw new ServiceUnavailableException('QPay үйлчилгээтэй холбогдож чадсангүй.');
    }
    if (!response.ok) {
      this.logger.error(`QPay auth failed: ${response.status}`);
      throw new ServiceUnavailableException('QPay үйлчилгээтэй холбогдож чадсангүй.');
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new ServiceUnavailableException('QPay үйлчилгээтэй холбогдож чадсангүй.');
    }
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = now + Math.max(0, (data.expires_in ?? 3600) - TOKEN_REFRESH_MARGIN_S) * 1000;
    return data.access_token;
  }

  private async post(path: string, token: string, body: unknown): Promise<Response> {
    const baseUrl = this.configService.getOrThrow<string>('qpay.baseUrl');
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`QPay ${path} network error: ${err instanceof Error ? err.message : String(err)}`);
      throw new ServiceUnavailableException('QPay үйлчилгээтэй холбогдож чадсангүй.');
    }
    if (!response.ok) {
      this.logger.error(`QPay ${path} returned ${response.status}`);
      throw new ServiceUnavailableException('QPay үйлчилгээ алдаа буцаалаа. Түр хүлээгээд дахин оролдоно уу.');
    }
    return response;
  }

  private mockInvoice(input: CreateQPayInvoiceInput): QPayInvoice {
    const invoiceId = `MOCK-${input.invoiceNumber}`;
    const qrText = `MOCK-QR:${invoiceId}:${input.amount}`;
    return {
      invoiceId,
      qrText,
      qrImage: '',
      shortUrl: `https://qpay.invalid/q/${invoiceId}`,
      urls: [
        { name: 'Mock Bank', description: 'QPAY_MOCK mode', logo: '', link: `mockbank://pay?qr=${encodeURIComponent(qrText)}` },
      ],
    };
  }
}
