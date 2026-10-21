import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Global Prefix
  app.setGlobalPrefix('api/v1');

  // 2. CORS configuration for Next.js frontend
  const corsOrigin = configService.get<string>('corsOrigin') ?? 'http://localhost:3000';
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 3. Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 4. Global Interceptors & Exception Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Swagger Interactive API Docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GoAylal Travel Platform API')
    .setDescription('Монгол аялагчдад зориулсан гадаад, дотоод аяллын төлөвлөгч системийн backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 6. Listen on Port
  const port = configService.get<number>('port') ?? 4000;
  await app.listen(port);
  console.log(`🚀 GoAylal Backend is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger API Docs available on: http://localhost:${port}/api/docs`);
}

await bootstrap();
