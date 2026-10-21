import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyPaymentDto {
  @ApiPropertyOptional({
    description: 'Зөвхөн QPAY_MOCK=true (production биш) үед хүчинтэй. Бусад үед үл тооцно.',
    deprecated: true,
  })
  @IsOptional()
  @IsBoolean()
  simulate?: boolean;
}

export class QPayCallbackDto {
  @ApiPropertyOptional({ description: 'QPay-ээс ирсэн төлбөрийн/нэхэмжлэхийн ID' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  payment_id?: string;
}
