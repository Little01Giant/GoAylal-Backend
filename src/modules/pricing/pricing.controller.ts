import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../admin/guards/admin.guard.js';
import { BulkDiscountsDto } from './dto/bulk-discounts.dto.js';
import { BulkPricingPlansDto } from './dto/bulk-pricing-plans.dto.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { CreatePricingPlanDto } from './dto/create-pricing-plan.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { UpdatePricingPlanDto } from './dto/update-pricing-plan.dto.js';
import { PricingService, type BulkResult, type DiscountView, type PricingPlanView } from './pricing.service.js';

@ApiTags('Admin Pricing')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Бүх үнийн төлөвлөгөө (одоо төлөгдөх үнийн хамт)' })
  @ApiResponse({ status: 200, description: 'Үнийн төлөвлөгөөнүүд' })
  async listPlans(): Promise<PricingPlanView[]> {
    return this.pricingService.listPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Шинэ үнийн төлөвлөгөө үүсгэх' })
  @ApiResponse({ status: 201, description: 'Төлөвлөгөө үүслээ.' })
  async createPlan(@Body() dto: CreatePricingPlanDto): Promise<PricingPlanView> {
    return this.pricingService.createPlan(dto);
  }

  @Post('plans/bulk')
  @HttpCode(200)
  @ApiOperation({ summary: 'Олон төлөвлөгөөг нэг дор идэвхжүүлэх / идэвхгүй болгох / устгах' })
  @ApiResponse({ status: 200, description: 'Нэгдсэн үр дүн' })
  async bulkPlans(@Body() dto: BulkPricingPlansDto): Promise<BulkResult> {
    return this.pricingService.bulkPlans(dto);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Үнийн төлөвлөгөө засах (код өөрчлөгдөхгүй)' })
  @ApiParam({ name: 'id', description: 'Төлөвлөгөөний ID' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн төлөвлөгөө' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePricingPlanDto): Promise<PricingPlanView> {
    return this.pricingService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Үнийн төлөвлөгөө устгах (үндсэн төлөвлөгөөг устгахгүй)' })
  @ApiParam({ name: 'id', description: 'Төлөвлөгөөний ID' })
  @ApiResponse({ status: 200, description: 'Устгагдлаа' })
  async deletePlan(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.pricingService.deletePlan(id);
  }

  @Get('discounts')
  @ApiOperation({ summary: 'Бүх хөнгөлөлт' })
  @ApiResponse({ status: 200, description: 'Хөнгөлөлтүүд' })
  async listDiscounts(): Promise<DiscountView[]> {
    return this.pricingService.listDiscounts();
  }

  @Post('discounts')
  @ApiOperation({ summary: 'Шинэ хөнгөлөлт үүсгэх' })
  @ApiResponse({ status: 201, description: 'Хөнгөлөлт үүслээ.' })
  async createDiscount(@Body() dto: CreateDiscountDto): Promise<DiscountView> {
    return this.pricingService.createDiscount(dto);
  }

  @Post('discounts/bulk')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Олон хөнгөлөлтөд нэг дор үйлдэл хийх',
    description:
      'activate / deactivate / delete, эсвэл update (төрөл, утга, огноо, төлөвлөгөөний хамрах хүрээ). update нь бүгдийг шалгаж, нэг нь буруу бол юу ч хадгалахгүй.',
  })
  @ApiResponse({ status: 200, description: 'Нэгдсэн үр дүн' })
  async bulkDiscounts(@Body() dto: BulkDiscountsDto): Promise<BulkResult> {
    return this.pricingService.bulkDiscounts(dto);
  }

  @Patch('discounts/:id')
  @ApiOperation({ summary: 'Хөнгөлөлт засах / идэвхжүүлэх / идэвхгүй болгох' })
  @ApiParam({ name: 'id', description: 'Хөнгөлөлтийн ID' })
  @ApiResponse({ status: 200, description: 'Шинэчлэгдсэн хөнгөлөлт' })
  async updateDiscount(@Param('id') id: string, @Body() dto: UpdateDiscountDto): Promise<DiscountView> {
    return this.pricingService.updateDiscount(id, dto);
  }

  @Delete('discounts/:id')
  @ApiOperation({ summary: 'Хөнгөлөлт устгах' })
  @ApiParam({ name: 'id', description: 'Хөнгөлөлтийн ID' })
  @ApiResponse({ status: 200, description: 'Устгагдлаа' })
  async deleteDiscount(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.pricingService.deleteDiscount(id);
  }
}
