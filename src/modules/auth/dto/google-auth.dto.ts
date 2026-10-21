import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google Identity Services-аас олгосон ID Token (credential)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsNotEmpty({ message: 'Google ID Token хоосон байж болохгүй' })
  @IsString({ message: 'Google ID Token текст төрөлтэй байх ёстой' })
  idToken: string;

  @ApiProperty({
    description: 'Нэмэлт нэр (заавал биш)',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Нэмэлт профайл зураг (заавал биш)',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
