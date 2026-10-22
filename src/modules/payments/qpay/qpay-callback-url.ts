/**
 * The callback URL QPay is given for one invoice: the configured base with our own invoice number appended
 * as a path segment, e.g. `https://api.goaylal.mn/api/v1/payments/qpay/callback/INV-2026-1022-0001`.
 * The invoice number identifies the transaction whatever QPay adds to the request, so the handler never has
 * to interpret QPay's payload (and never trusts it: the payment is always re-checked with QPay).
 */
export function buildInvoiceCallbackUrl(baseCallbackUrl: string, invoiceNumber: string): string {
  return `${baseCallbackUrl.replace(/\/+$/, '')}/${encodeURIComponent(invoiceNumber)}`;
}
