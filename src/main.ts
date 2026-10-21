import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApp } from './common/configure-app.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GoAylal Travel Platform API')
    .setDescription('Монгол аялагчдад зориулсан гадаад, дотоод аяллын төлөвлөгч системийн backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Bind 0.0.0.0 for Render, Docker & cloud container compatibility
  const port = configService.get<number>('port') ?? 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`GoAylal Backend is running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger API docs: http://localhost:${port}/api/docs`);
}

await bootstrap();
