import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const MAX_CHAT_MESSAGE_LENGTH = 1000;

export class AiChatRequestDto {
  @ApiProperty({
    description: `Хэрэглэгчийн асуулт эсвэл хүсэлт (дээд тал нь ${MAX_CHAT_MESSAGE_LENGTH} тэмдэгт)`,
    example: 'Бээжин рүү 5 өдрийн аялал төлөвлөе',
  })
  @IsNotEmpty({ message: 'Мессеж хоосон байж болохгүй.' })
  @IsString()
  @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
  message: string;

  @ApiPropertyOptional({ description: 'Чат сессийн ID', example: '665f1c2e9b1e8a0012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string | undefined;

  @ApiPropertyOptional({ description: 'Deprecated: sessionId-ийн нэр (docs). sessionId байвал үүнийг үл тооцно.', deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string | undefined;
}
