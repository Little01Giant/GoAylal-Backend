import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Destination, DestinationSchema } from './schemas/destination.schema.js';
import { Attraction, AttractionSchema } from './schemas/attraction.schema.js';
import { Hotel, HotelSchema } from './schemas/hotel.schema.js';
import { Transport, TransportSchema } from './schemas/transport.schema.js';
import { SuggestedTrip, SuggestedTripSchema } from './schemas/suggested-trip.schema.js';
import { DestinationsService } from './destinations.service.js';
import { DestinationsController } from './destinations.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Destination.name, schema: DestinationSchema },
      { name: Attraction.name, schema: AttractionSchema },
      { name: Hotel.name, schema: HotelSchema },
      { name: Transport.name, schema: TransportSchema },
      { name: SuggestedTrip.name, schema: SuggestedTripSchema },
    ]),
  ],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
