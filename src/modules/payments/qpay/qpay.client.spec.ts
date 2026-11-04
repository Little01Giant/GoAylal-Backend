import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QPayClient } from './qpay.client.js';

const CONFIG: Record<string, unknown> = {
  'qpay.mock': false,
  'qpay.baseUrl': 'https://qpay.test/v2',
  'qpay.clientId': 'client',
  'qpay.clientSecret': 'secret',
  'qpay.invoiceCode': 'CODE',
  'qpay.callbackUrl': 'https://api.test/callback',
};

const configService = {
  get: (key: string) => CONFIG[key],
  getOrThrow: (key: string) => CONFIG[key],
} as unknown as ConfigService;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const tokenResponse = (token: string) => json(200, { access_token: token, expires_in: 3600 });
const invoiceResponse = () => json(200, { invoice_id: 'inv-1' });
const input = { invoiceNumber: 'INV-1', amount: 1000, description: 'test' };

describe('QPayClient invoice creation', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('refreshes a revoked token once and retries the invoice', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('stale'))
      .mockResolvedValueOnce(json(401, { error: 'ACCESS_DENIED' }))
      .mockResolvedValueOnce(tokenResponse('fresh'))
      .mockResolvedValueOnce(invoiceResponse());

    const invoice = await new QPayClient(configService).createInvoice(input);

    expect(invoice.invoiceId).toBe('inv-1');
    const retry = fetchMock.mock.calls[3]?.[1] as RequestInit;
    expect((retry.headers as Record<string, string>).Authorization).toBe('Bearer fresh');
  });

  it('gives up after a second 401 instead of retrying forever', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('a'))
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(tokenResponse('b'))
      .mockResolvedValueOnce(json(401, {}));

    await expect(new QPayClient(configService).createInvoice(input)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not retry other QPay errors', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse('a')).mockResolvedValueOnce(json(400, { error: 'BAD' }));

    await expect(new QPayClient(configService).createInvoice(input)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
