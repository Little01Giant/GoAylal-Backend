import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttractionCategory } from '../../destinations/schemas/attraction.schema.js';
import { TransportType } from '../../destinations/schemas/transport.schema.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = 'зөвхөн жижиг латин үсэг, тоо, зураас агуулна';
const HTTP_URL = /^https?:\/\/\S+$/;
const URL_MESSAGE = 'http(s) холбоос байх ёстой';
const CATEGORIES = Object.values(AttractionCategory);
const TRANSPORT_TYPES = Object.values(TransportType);

export class UpsertAttractionDto {
  @ApiProperty({ example: 'sh-att-01', description: 'Үзвэрийн тогтмол код (өөрчлөхгүй)' })
  @IsString()
  @MaxLength(64)
  @Matches(SLUG, { message: `id ${SLUG_MESSAGE}` })
  id: string;

  @ApiProperty({ example: 1, description: 'Алдартай байдлын дараалал (1 = эхний). Эхний 10 нь анхдагчаар сонгогдоно.' })
  @IsInt()
  @Min(1)
  rank: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: string;

  @ApiProperty({ example: 'Pudong, Shanghai' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  region: string;

  @ApiProperty({ example: 0, description: '1 өдрийн насанд хүрэгчийн тасалбар (MNT). Үнэгүй бол 0.' })
  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.25)
  @Max(48)
  estimatedHours: number;

  @ApiProperty()
  @IsString()
  @Matches(HTTP_URL, { message: `imageUrl ${URL_MESSAGE}` })
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @Matches(HTTP_URL, { each: true, message: `images ${URL_MESSAGE}` })
  images?: string[];

  @ApiProperty({ example: 4.7 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  highlights: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}

export class UpsertHotelDto {
  @ApiProperty({ example: 'hotel-sh-level-1' })
  @IsString()
  @MaxLength(64)
  @Matches(SLUG, { message: `id ${SLUG_MESSAGE}` })
  id: string;

  @ApiProperty({ example: 'Хямд буудал (Төсөвт 2 од)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(5)
  starRating: number;

  @ApiProperty({ example: 100000, description: '1 өрөө, 1 шөнө (MNT)' })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty()
  @IsString()
  @Matches(HTTP_URL, { message: `imageUrl ${URL_MESSAGE}` })
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  locationDesc: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  amenities: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge?: string;
}

export class UpsertTransportDto {
  @ApiProperty({ example: 'tr-sh-flight' })
  @IsString()
  @MaxLength(64)
  @Matches(SLUG, { message: `id ${SLUG_MESSAGE}` })
  id: string;

  @ApiProperty({ enum: TRANSPORT_TYPES })
  @IsIn(TRANSPORT_TYPES)
  type: 'flight' | 'combined' | 'overland';

  @ApiProperty({ example: 'Дан нислэг' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '3 цаг 45 минут' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  durationText: string;

  @ApiProperty({ example: 1024200, description: '1 хүний 2 талын зардал (MNT)' })
  @IsNumber()
  @Min(0)
  pricePerPerson: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  provider?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  departureFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  arrivalAt?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  features?: string[];
}

/**
 * Body of `PUT /admin/destinations/:key`: one whole city. The city key comes from the URL.
 * Rows are matched by their `id`; rows not listed are left as they are.
 */
export class UpsertDestinationDto {
  @ApiProperty({ example: 'Шанхай' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Хятад' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 'china' })
  @IsString()
  @MaxLength(64)
  @Matches(SLUG, { message: `countryKey ${SLUG_MESSAGE}` })
  countryKey: string;

  @ApiProperty({ example: '🇨🇳' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  flag: string;

  @ApiProperty({ example: 'Орчин үе, Диснейлэнд & Хуанпу гол' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tag: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, description: 'Онцлох чиглэл эсэх. Өгөхгүй бол шинэ хотыг онцлох болгоно.' })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiProperty({ type: [UpsertAttractionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => UpsertAttractionDto)
  attractions: UpsertAttractionDto[];

  @ApiProperty({ type: [UpsertHotelDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpsertHotelDto)
  hotels: UpsertHotelDto[];

  @ApiProperty({ type: [UpsertTransportDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpsertTransportDto)
  transports: UpsertTransportDto[];
}
