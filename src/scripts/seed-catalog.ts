/**
 * Idempotent catalog sync (destinations, attractions, hotels, transports) without starting the HTTP server.
 *   npm run build && npm run seed:catalog
 * Safe to re-run: rows are upserted by (destinationKey, seedId) and nothing is deleted.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { DestinationsService } from '../modules/destinations/destinations.service.js';

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
try {
  await app.get(DestinationsService).seedCatalog();
} finally {
  await app.close();
}
