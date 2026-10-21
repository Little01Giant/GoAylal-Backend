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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AdminService,
  type AdminStatsResult,
  type AdminUserItem,
} from './admin.service.js';
import { AdminGuard } from './guards/admin.guard.js';
import { CreateSuggestedTripDto } from './dto/create-suggested-trip.dto.js';
import { UpdateSuggestedTripDto } from './dto/update-suggested-trip.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import type { PaymentTransactionDocument } from '../payments/schemas/payment-transaction.schema.js';
import type { SuggestedTripDocument } from '../destinations/schemas/suggested-trip.schema.js';
import type { UserDocument } from '../auth/schemas/user.schema.js';
import type { PaymentVerificationResult } from '../payments/payments.service.js';

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
  @ApiOperation({ summary: 'Бүх гүйлгээнүүдийн жагсаалт авах' })
  @ApiQuery({ name: 'search', required: false, description: 'Хайх үг (гүйлгээний дугаар, и-мэйл)' })
  @ApiQuery({ name: 'status', required: false, description: 'Статус (completed, pending, all)' })
  @ApiQuery({ name: 'page', required: false, description: 'Хуудасны дугаар' })
  @ApiQuery({ name: 'limit', required: false, description: 'Хуудас дахь тоо' })
  @ApiResponse({ status: 200, description: 'Гүйлгээнүүдийн жагсаалт' })
  async getTransactions(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: PaymentTransactionDocument[]; total: number; page: number; totalPages: number }> {
    return this.adminService.getTransactions({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Нэг гүйлгээний дэлгэрэнгүй баримт & snapshot харах' })
  @ApiParam({ name: 'id', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Гүйлгээний дэлгэрэнгүй' })
  async getTransactionDetails(@Param('id') id: string): Promise<PaymentTransactionDocument> {
    return this.adminService.getTransactionDetails(id);
  }

  @Post('transactions/:id/recheck')
  @ApiOperation({ summary: 'QPay API-аас гүйлгээний төлөвийг дахин бодитоор шалгах' })
  @ApiParam({ name: 'id', description: 'Гүйлгээний ID эсвэл дугаар' })
  @ApiResponse({ status: 200, description: 'Шалгалтын үр дүн' })
  async recheckTransaction(@Param('id') id: string): Promise<PaymentVerificationResult> {
    return this.adminService.recheckTransaction(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Бүртгэлтэй хэрэглэгчдийн жагсаалт авах' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Хэрэглэгчдийн жагсаалт' })
  async getUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: AdminUserItem[]; total: number; page: number }> {
    return this.adminService.getUsers({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Хэрэглэгчийн эрх өөрчлөх (user / admin)' })
  @ApiParam({ name: 'id', description: 'Хэрэглэгчийн ID' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн хэрэглэгч' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserDocument> {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Бүх бэлэн төлөвлөгөө авах' })
  @ApiResponse({ status: 200, description: 'Бэлэн аяллын хөтөлбөрүүд' })
  async getTrips(): Promise<SuggestedTripDocument[]> {
    return this.adminService.getTrips();
  }

  @Post('trips')
  @ApiOperation({ summary: 'Шинэ бэлэн төлөвлөгөө үүсгэх' })
  @ApiResponse({ status: 201, description: 'Төлөвлөгөө амжилттай үүслээ.' })
  async createTrip(@Body() dto: CreateSuggestedTripDto): Promise<SuggestedTripDocument> {
    return this.adminService.createTrip(dto);
  }

  @Put('trips/:id')
  @ApiOperation({ summary: 'Бэлэн төлөвлөгөө засах' })
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
