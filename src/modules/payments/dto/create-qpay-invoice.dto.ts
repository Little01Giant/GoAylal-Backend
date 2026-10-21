import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class CreateQPayInvoiceDto {
  @ApiPropertyOptional({ description: 'Хөтөлбөрийн ID', example: 'trip-beijing' })
  @IsOptional()
  @IsString()
  itineraryId?: string | undefined;

  @ApiPropertyOptional({ description: 'Хэрэглэгчийн ID' })
  @IsOptional()
  @IsString()
  userId?: string | undefined;

  @ApiPropertyOptional({ description: 'Хэрэглэгчийн имэйл хаяг', example: 'traveler@goaylal.mn' })
  @IsOptional()
  @IsString()
  email?: string | undefined;

  @ApiPropertyOptional({ description: 'Нэхэмжлэх дүн (₮)', example: 100 })
  @IsOptional()
  @IsNumber()
  amount?: number | undefined;

  @ApiPropertyOptional({ description: 'Нэхэмжлэхийн гарчиг', example: 'Бээжин аяллын бүрэн төлөвлөгөө' })
  @IsOptional()
  @IsString()
  title?: string | undefined;

  @ApiPropertyOptional({ description: 'Төлөвлөгөөний хураангуй өгөгдөл' })
  @IsOptional()
  @IsObject()
  planSnapshot?: Record<string, unknown> | undefined;
}
