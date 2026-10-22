import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Pricing is server-side: the amount comes from the chosen pricing plan (the default plan when none is
 * given) minus its best live discount. The amount-like fields below are accepted only because the
 * current frontend still sends them; they are ignored.
 */
export class CreateQPayInvoiceDto {
  @ApiPropertyOptional({ description: 'Сонгосон үнийн төлөвлөгөөний ID (өгөөгүй бол үндсэн төлөвлөгөө)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string | undefined;

  @ApiPropertyOptional({ description: 'Хадгалсан аяллын хөтөлбөрийн ID (нэвтэрсэн хэрэглэгчийн өөрийн хөтөлбөр)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  itineraryId?: string | undefined;

  @ApiPropertyOptional({ description: 'Имэйл хаяг (нэвтрээгүй хэрэглэгчид заавал)', example: 'traveler@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | undefined;

  @ApiPropertyOptional({ description: 'Нэхэмжлэхийн гарчиг', example: 'Бээжин аяллын бүрэн төлөвлөгөө' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | undefined;

  @ApiPropertyOptional({ description: 'Төлөвлөгөөний хураангуй (зөвхөн харуулах зориулалттай)' })
  @IsOptional()
  @IsObject()
  planSnapshot?: Record<string, unknown> | undefined;

  @ApiPropertyOptional({ deprecated: true, description: 'Үл тооцно: дүнг сервер тодорхойлно.' })
  @IsOptional()
  @IsNumber()
  amount?: number | undefined;

  @ApiPropertyOptional({ deprecated: true, description: 'Үл тооцно: хэрэглэгчийг токеноос тодорхойлно.' })
  @IsOptional()
  @IsString()
  userId?: string | undefined;
}
