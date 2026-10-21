import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSuggestedTripDto } from './create-suggested-trip.dto.js';

/** The slug is the public identifier and cannot be changed after creation. */
export class UpdateSuggestedTripDto extends PartialType(OmitType(CreateSuggestedTripDto, ['slug'] as const)) {}
