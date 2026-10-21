import { PartialType } from '@nestjs/swagger';
import { CreateSuggestedTripDto } from './create-suggested-trip.dto.js';

export class UpdateSuggestedTripDto extends PartialType(CreateSuggestedTripDto) {}
