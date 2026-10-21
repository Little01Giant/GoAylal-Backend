import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiChatRequestDto {
  @ApiProperty({ description: 'Хэрэглэгчийн асуулт эсвэл хүсэлт', example: 'Бээжин рүү 5 өдрийн аялал төлөвлөе' })
  @IsNotEmpty({ message: 'Мессеж хоосон байж болохгүй.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Чат сессийн ID', example: 'session-12345' })
  @IsOptional()
  @IsString()
  sessionId?: string | undefined;
}
