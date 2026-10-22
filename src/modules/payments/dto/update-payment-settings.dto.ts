import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** A boolean sets the dashboard override; `null` removes it so the environment value applies again. */
export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional({ nullable: true, description: 'Нэвтрээгүй хэрэглэгч төлбөр хийж болох эсэх' })
  @IsOptional()
  @IsBoolean()
  guestCheckoutEnabled?: boolean | null;

  @ApiPropertyOptional({ nullable: true, description: 'Төлбөрийн дараа хөтөлбөрийг и-мэйлээр илгээх эсэх' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean | null;
}
