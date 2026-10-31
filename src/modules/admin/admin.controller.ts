import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  AdminService,
  type AdminStatsResult,
  type AdminUserItem,
  type Page,
} from './admin.service.js';
import { AdminGuard } from './guards/admin.guard.js';
import { CreateSuggestedTripDto } from './dto/create-suggested-trip.dto.js';
import { UpdateSuggestedTripDto } from './dto/update-suggested-trip.dto.js';
import { UpsertDestinationDto } from './dto/upsert-destination.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { AdminTransactionsQueryDto, AdminUsersQueryDto } from './dto/admin-query.dto.js';
import { BulkTransactionsDto } from './dto/bulk-transactions.dto.js';
import { UpdatePaymentSettingsDto } from '../payments/dto/update-payment-settings.dto.js';
import type { PaymentTransactionDocument } from '../payments/schemas/payment-transaction.schema.js';
import type { SuggestedTripDocument } from '../destinations/schemas/suggested-trip.schema.js';
import type { BulkTransactionsResult, PaymentVerificationResult } from '../payments/payments.service.js';
import type { EffectivePaymentSettings } from '../payments/payment-settings.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Админ хяналтын самбарын ерөнхий статистик' })
  @ApiResponse({ status: 200, description: 'Статистик амжилттай буцлаа.' })
  async getStats(): Promise<AdminStatsResult> {
    return this.adminService.getStats();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Бүх гүйлгээнүүдийн жагсаалт (page ≥ 1, 1 ≤ limit ≤ 100)' })
  @ApiResponse({ status: 200, description: 'Гүйлгээнүүдийн жагсаалт' })
  async getTransactions(@Query() query: AdminTransactionsQueryDto): Promise<Page<PaymentTransactionDocument>> {
    return this.adminService.getTransactions(query);
  }

  @Post('transactions/bulk')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Олон гүйлгээнд нэг дор үйлдэл хийх (дахин шалгах / хугацаа дууссан болгох / буцаагдсан гэж тэмдэглэх)',
  })
  @ApiResponse({ status: 200, description: 'Нэгдсэн үр дүн' })
  async bulkTransactions(@Body() dto: BulkTransactionsDto): Promise<BulkTransactionsResult> {
    return this.adminService.bulkTransactions(dto);
  }

  @Get('payment-settings')
  @ApiOperation({ summary: 'Төлбөрийн тохиргоо (хүчинтэй утга ба эх сурвалж)' })
  @ApiResponse({ status: 200, description: 'Төлбөрийн тохиргоо' })
  async getPaymentSettings(): Promise<EffectivePaymentSettings> {
    return this.adminService.getPaymentSettings();
  }

  @Put('payment-settings')
  @ApiOperation({ summary: 'Төлбөрийн тохиргоо өөрчлөх (null = .env утгыг дахин ашиглах)' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн тохиргоо' })
  async updatePaymentSettings(@Body() dto: UpdatePaymentSettingsDto): Promise<EffectivePaymentSettings> {
    return this.adminService.updatePaymentSettings(dto);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Нэг гүйлгээний дэлгэрэнгүй баримт & snapshot харах' })
  @ApiParam({ name: 'id', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Гүйлгээний дэлгэрэнгүй' })
  async getTransactionDetails(@Param('id') id: string): Promise<PaymentTransactionDocument> {
    return this.adminService.getTransactionDetails(id);
  }

  @Post('transactions/:id/recheck')
  @HttpCode(200)
  @ApiOperation({ summary: 'QPay API-аас гүйлгээний төлөвийг дахин бодитоор шалгах' })
  @ApiParam({ name: 'id', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Шалгалтын үр дүн' })
  async recheckTransaction(@Param('id') id: string): Promise<PaymentVerificationResult> {
    return this.adminService.recheckTransaction(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Бүртгэлтэй хэрэглэгчдийн жагсаалт (page ≥ 1, 1 ≤ limit ≤ 100)' })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчдийн жагсаалт' })
  async getUsers(@Query() query: AdminUsersQueryDto): Promise<Page<AdminUserItem>> {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Хэрэглэгчийн эрх өөрчлөх (user / admin)' })
  @ApiParam({ name: 'id', description: 'Хэрэглэгчийн ID' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн хэрэглэгч' })
  @ApiResponse({ status: 409, description: 'Сүүлчийн админы эрхийг бууруулах боломжгүй.' })
  async updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Бүх бэлэн төлөвлөгөө авах' })
  @ApiResponse({ status: 200, description: 'Бэлэн аяллын төлөвлөгөөнүүд' })
  async getTrips(): Promise<SuggestedTripDocument[]> {
    return this.adminService.getTrips();
  }

  @Get('destinations')
  @ApiOperation({ summary: 'Мэдээллийн сан дахь хотуудын жагсаалт (үзвэр, буудал, тээврийн тоотой)' })
  @ApiResponse({ status: 200, description: 'Хотуудын жагсаалт' })
  async getDestinations(): ReturnType<AdminService['getDestinations']> {
    return this.adminService.getDestinations();
  }

  @Put('destinations/:key')
  @ApiOperation({
    summary: 'Хот + үзвэр, буудал, тээврийг мэдээллийн санд нэмэх/засах (код өөрчлөхгүй). id-аар таарна, жагсаалтад байхгүй мөрийг хөндөхгүй.',
  })
  @ApiParam({ name: 'key', description: 'Хотын түлхүүр код (жишээ: shanghai)' })
  @ApiResponse({ status: 200, description: 'Хот хадгалагдлаа' })
  async upsertDestination(
    @Param('key') key: string,
    @Body() dto: UpsertDestinationDto,
  ): ReturnType<AdminService['upsertDestination']> {
    return this.adminService.upsertDestination(key, dto);
  }

  @Post('trips')
  @ApiOperation({ summary: 'Шинэ бэлэн төлөвлөгөө үүсгэх' })
  @ApiResponse({ status: 201, description: 'Төлөвлөгөө амжилттай үүслээ.' })
  async createTrip(@Body() dto: CreateSuggestedTripDto): Promise<SuggestedTripDocument> {
    return this.adminService.createTrip(dto);
  }

  @Put('trips/:id')
  @ApiOperation({ summary: 'Бэлэн төлөвлөгөө засах (slug өөрчлөгдөхгүй)' })
  @ApiParam({ name: 'id', description: 'Аяллын slug эсвэл ID' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн төлөвлөгөө' })
  async updateTrip(
    @Param('id') id: string,
    @Body() dto: UpdateSuggestedTripDto,
  ): Promise<SuggestedTripDocument> {
    return this.adminService.updateTrip(id, dto);
  }

  @Delete('trips/:id')
  @ApiOperation({ summary: 'Бэлэн төлөвлөгөө устгах' })
  @ApiParam({ name: 'id', description: 'Аяллын slug эсвэл ID' })
  @ApiResponse({ status: 200, description: 'Устгагдлаа' })
  async deleteTrip(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.adminService.deleteTrip(id);
  }
}
