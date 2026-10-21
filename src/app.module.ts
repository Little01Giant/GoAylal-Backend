import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
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
    ConfigModule.forRoot({
      isGlobal: true,
      // Tests configure the environment explicitly and must never pick up a developer's local .env secrets.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      load: [configuration],
      validate: validateEnv,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<boolean>('isProduction') ?? false;
        const uri = await resolveMongoUri(configService.getOrThrow<string>('database.uri'), isProduction);
        // Production never builds indexes implicitly; run `npm run migrate:payment-indexes` instead.
        return { uri, autoIndex: !isProduction };
      },
      inject: [ConfigService],
    }),

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
