import { buildInvoiceCallbackUrl } from './qpay-callback-url.js';

describe('buildInvoiceCallbackUrl', () => {
  it('appends the invoice number as a path segment', () => {
    expect(buildInvoiceCallbackUrl('https://api.goaylal.mn/api/v1/payments/qpay/callback', 'INV-2026-1022-0001')).toBe(
      'https://api.goaylal.mn/api/v1/payments/qpay/callback/INV-2026-1022-0001',
    );
  });

  it('does not double the slash when the base already ends with one', () => {
    expect(buildInvoiceCallbackUrl('http://localhost:4000/api/v1/payments/qpay/callback/', 'INV-1')).toBe(
      'http://localhost:4000/api/v1/payments/qpay/callback/INV-1',
    );
  });

  it('encodes anything unsafe in the invoice number', () => {
    expect(buildInvoiceCallbackUrl('https://x.test/cb', 'a/b?c')).toBe('https://x.test/cb/a%2Fb%3Fc');
  });
});
