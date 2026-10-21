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
  ): Promise<{ received: boolean; verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleCallback(body.payment_id ?? queryPaymentId);
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
