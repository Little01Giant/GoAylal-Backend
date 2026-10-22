import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  PaymentsService,
  type QPayInvoiceResult,
  type PaymentVerificationResult,
  type PaymentHistoryItemDto,
} from './payments.service.js';
import { CreateQPayInvoiceDto } from './dto/create-qpay-invoice.dto.js';
import { QPayCallbackDto, VerifyPaymentDto } from './dto/verify-payment.dto.js';
import type { PaymentTransaction } from './schemas/payment-transaction.schema.js';
import type { Types } from 'mongoose';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RateLimit, RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { requireUser } from '../../common/utils/require-user.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qpay/create-invoice')
  @UseGuards(OptionalJwtAuthGuard, RateLimitGuard)
  @RateLimit(10)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'QPay нэхэмжлэх үүсгэж QR код авах',
    description:
      'Дүнг сервер тодорхойлно (client-ийн дүнг үл тооцно). Нэвтэрсэн хэрэглэгч зөвхөн өөрийн хөтөлбөрт нэхэмжлэх үүсгэнэ. Нэвтрээгүй хэрэглэгч зөвхөн GUEST_CHECKOUT_ENABLED үед (түр хугацаанд).',
  })
  @ApiResponse({ status: 201, description: 'QPay нэхэмжлэх амжилттай үүслээ.' })
  @ApiResponse({ status: 401, description: 'Нэвтрээгүй хэрэглэгчийн төлбөр идэвхгүй байна.' })
  async createInvoice(
    @Body() dto: CreateQPayInvoiceDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<QPayInvoiceResult> {
    return this.paymentsService.createQPayInvoice(dto, user);
  }

  @Post('qpay/callback')
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  @RateLimit(60)
  @ApiOperation({ summary: 'QPay Webhook хүлээн авах (QPay-аар дахин баталгаажуулна)' })
  @ApiResponse({ status: 200, description: 'Webhook боловсруулагдлаа.' })
  async qpayCallback(
    @Body() body: QPayCallbackDto,
    @Query('qpay_payment_id') queryPaymentId?: string,
    @Query('payment_id') queryOwnId?: string,
  ): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleCallback(body.payment_id ?? queryOwnId ?? queryPaymentId);
  }

  /** The base callback URL may also be called with GET and `?payment_id=<our id>`, the form in QPay's own example. */
  @Get('qpay/callback')
  @UseGuards(RateLimitGuard)
  @RateLimit(60)
  @ApiOperation({ summary: 'QPay Webhook (GET, ?payment_id=<манай дугаар>): POST-тэй ижил боловсруулалт' })
  @ApiResponse({ status: 200, description: 'Webhook боловсруулагдлаа.' })
  async qpayCallbackGet(
    @Query('payment_id') queryOwnId?: string,
    @Query('qpay_payment_id') queryPaymentId?: string,
  ): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleCallback(queryOwnId ?? queryPaymentId);
  }

  @Post('qpay/callback/:invoiceNumber')
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  @RateLimit(60)
  @ApiOperation({
    summary: 'QPay Webhook (нэхэмжлэх тус бүрийн хаяг): QPay-ийн агуулгад итгэхгүй, QPay-аар дахин баталгаажуулна',
  })
  @ApiParam({ name: 'invoiceNumber', description: 'Манай нэхэмжлэхийн дугаар (INV-...)' })
  @ApiResponse({ status: 200, description: 'Webhook боловсруулагдлаа.' })
  async qpayInvoiceCallbackPost(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleInvoiceCallback(invoiceNumber);
  }

  /** QPay may call the callback URL with GET; the handling is identical. */
  @Get('qpay/callback/:invoiceNumber')
  @UseGuards(RateLimitGuard)
  @RateLimit(60)
  @ApiOperation({ summary: 'QPay Webhook (GET хэлбэр): POST-тэй ижил боловсруулалт' })
  @ApiParam({ name: 'invoiceNumber', description: 'Манай нэхэмжлэхийн дугаар (INV-...)' })
  @ApiResponse({ status: 200, description: 'Webhook боловсруулагдлаа.' })
  async qpayInvoiceCallbackGet(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleInvoiceCallback(invoiceNumber);
  }

  @Get('status/:transactionId')
  @UseGuards(RateLimitGuard)
  @RateLimit(120)
  @ApiOperation({
    summary: 'Төлбөрийн төлөв (хуудасны шалгалтад): QPay-г зөвхөн хааяа асууна',
    description:
      'Манай бүртгэлээс уншина. QPay-аас зөвхөн нэхэмжлэх QPAY_STATUS_CHECK_INTERVAL_S секунд хүлээгдсэний дараа, тэр хугацаанд нэг л удаа асууна (0 = хэзээ ч асуухгүй, зөвхөн callback).',
  })
  @ApiParam({ name: 'transactionId', description: 'Гүйлгээний дугаар эсвэл ID' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн төлөв' })
  async getPaymentStatus(@Param('transactionId') transactionId: string): Promise<PaymentVerificationResult> {
    return this.paymentsService.getPaymentStatus(transactionId);
  }

  @Post('verify/:transactionId')
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  @RateLimit(60)
  @ApiOperation({ summary: 'Төлбөр баталгаажуулах (зөвхөн QPay баталгаажуулсан үед settle хийнэ)' })
  @ApiParam({ name: 'transactionId', description: 'Гүйлгээний дугаар эсвэл ID' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн баталгаажуулалтын хариу' })
  async verifyPayment(
    @Param('transactionId') transactionId: string,
    @Body() body: VerifyPaymentDto,
  ): Promise<PaymentVerificationResult> {
    return this.paymentsService.verifyPayment(transactionId, { simulate: body.simulate === true });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Хэрэглэгчийн төлбөрийн түүх авах' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн түүхийн жагсаалт' })
  async getMyPayments(@CurrentUser() user: AuthenticatedUser | undefined): Promise<PaymentHistoryItemDto[]> {
    return this.paymentsService.findUserPayments(requireUser(user));
  }

  @Get('receipt/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Цахим баримт харах (зөвхөн эзэмшигч / админ)' })
  @ApiParam({ name: 'transactionId', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Цахим баримт амжилттай олдлоо.' })
  async getReceipt(
    @Param('transactionId') transactionId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<PaymentTransaction & { _id: Types.ObjectId }> {
    return this.paymentsService.getReceipt(transactionId, requireUser(user));
  }
}
