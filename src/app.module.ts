import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DestinationsModule } from './modules/destinations/destinations.module.js';
import { ItinerariesModule } from './modules/itineraries/itineraries.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AiPlannerModule } from './modules/ai-planner/ai-planner.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { resolveMongoUri } from './config/database.helper.js';

@Module({
  imports: [
    // Global environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // MongoDB connection via Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const configuredUri =
          configService.get<string>('database.uri') ?? 'mongodb://127.0.0.1:27017/goaylal';
        const finalUri = await resolveMongoUri(configuredUri);
        return { uri: finalUri };
      },
      inject: [ConfigService],
    }),

    // Business feature modules
    AuthModule,
    DestinationsModule,
    ItinerariesModule,
    PaymentsModule,
    AiPlannerModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
