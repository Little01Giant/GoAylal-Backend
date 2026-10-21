import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
}

const RATE_LIMIT_KEY = 'rate-limit';

/** Per-client request cap for a route. Counters are in-memory, so under PM2 cluster mode the cap applies per worker. */
export const RateLimit = (limit: number, windowMs: number = 60_000): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs } satisfies RateLimitOptions);

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    setInterval(() => this.sweep(), 60_000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.configService.get<boolean>('rateLimit.enabled') === false) {
      return true;
    }
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = `${context.getClass().name}:${context.getHandler().name}:${request.ip ?? 'unknown'}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }
    bucket.count += 1;
    if (bucket.count > options.limit) {
      throw new HttpException(
        { message: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.', code: 'RATE_LIMITED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
