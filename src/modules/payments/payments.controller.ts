import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  PaymentsService,
  type QPayInvoiceResult,
  type PaymentVerificationResult,
  type PaymentHistoryItemDto,
} from './payments.service.js';
import { CreateQPayInvoiceDto } from './dto/create-qpay-invoice.dto.js';
import type { PaymentTransaction } from './schemas/payment-transaction.schema.js';
import type { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qpay/create-invoice')
  @ApiOperation({ summary: 'QPay нэхэмжлэх үүсгэж QR код авах' })
  @ApiResponse({ status: 201, description: 'QPay нэхэмжлэх амжилттай үүслээ.' })
  async createInvoice(
    @Body() dto: CreateQPayInvoiceDto,
  ): Promise<QPayInvoiceResult> {
    return this.paymentsService.createQPayInvoice(dto);
  }

  @Post('qpay/callback')
  @ApiOperation({ summary: 'QPay Webhook хүлээн авах' })
  @ApiResponse({ status: 200, description: 'Webhook амжилттай боловсруулагдлаа.' })
  async qpayCallback(@Body('payment_id') paymentId: string): Promise<{ verified: boolean; transactionNumber: string }> {
    return this.paymentsService.handleCallback(paymentId);
  }

  @Post('verify/:transactionId')
  @ApiOperation({ summary: 'Төлбөр баталгаажуулах' })
  @ApiParam({ name: 'transactionId', description: 'Гүйлгээний дугаар эсвэл ID' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн баталгаажуулалтын хариу' })
  async verifyPayment(
    @Param('transactionId') transactionId: string,
    @Body('simulate') simulate?: boolean,
  ): Promise<PaymentVerificationResult> {
    return this.paymentsService.verifyPayment(transactionId, !!simulate);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Хэрэглэгчийн төлбөрийн түүх авах' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн түүхийн жагсаалт' })
  async getMyPayments(
    @Req() req: { user: { sub: string } },
  ): Promise<PaymentHistoryItemDto[]> {
    return this.paymentsService.findUserPayments(req.user.sub);
  }

  @Get('receipt/:transactionId')
  @ApiOperation({ summary: 'Цахим баримт харах' })
  @ApiParam({ name: 'transactionId', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Цахим баримт амжилттай олдлоо.' })
  async getReceipt(
    @Param('transactionId') transactionId: string,
  ): Promise<PaymentTransaction & { _id: Types.ObjectId }> {
    return this.paymentsService.getReceipt(transactionId);
  }
}
