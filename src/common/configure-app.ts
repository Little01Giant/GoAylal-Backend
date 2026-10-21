import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AllExceptionsFilter } from './filters/http-exception.filter.js';
import { TransformInterceptor } from './interceptors/transform.interceptor.js';

const BODY_LIMIT = '256kb';

function securityHeaders(isProduction: boolean) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.removeHeader('X-Powered-By');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    }
    next();
  };
}

/** Shared by main.ts and the e2e tests so tests exercise the same prefix, pipes, filter and CORS as production. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const express = app as NestExpressApplication;
  const isProduction = config.get<boolean>('isProduction') ?? false;

  express.setGlobalPrefix('api/v1');
  express.set('trust proxy', config.get<number>('trustProxy') ?? 0);
  express.useBodyParser('json', { limit: BODY_LIMIT });
  express.use(securityHeaders(isProduction));
  express.enableCors({
    origin: config.get<string[]>('corsOrigins') ?? [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Unknown properties are stripped (not rejected) while the current frontend still sends extra fields.
  express.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  express.useGlobalInterceptors(new TransformInterceptor());
  express.useGlobalFilters(new AllExceptionsFilter());
}
