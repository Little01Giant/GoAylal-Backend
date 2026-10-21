import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google Identity Services-аас олгосон ID Token (credential)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsNotEmpty({ message: 'Google ID Token хоосон байж болохгүй' })
  @IsString({ message: 'Google ID Token текст төрөлтэй байх ёстой' })
  @MaxLength(4096)
  idToken: string;

  @ApiProperty({
    description: 'Deprecated: хүлээн авч байгаа боловч үл тооцно (нэрийг Google токеноос авна).',
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    description: 'Deprecated: хүлээн авч байгаа боловч үл тооцно (зургийг Google токеноос авна).',
    required: false,
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string;
}
