import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

const STATUS_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

const INTERNAL_MESSAGE = 'Серверт тодорхойгүй алдаа гарлаа. Дахин оролдоно уу.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = INTERNAL_MESSAGE;
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? `HTTP_${status}`;
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const parsed = body as { message?: unknown; code?: unknown };
        if (Array.isArray(parsed.message)) {
          message = parsed.message.map((m) => String(m)).join(', ');
        } else if (typeof parsed.message === 'string') {
          message = parsed.message;
        }
        if (typeof parsed.code === 'string') {
          code = parsed.code;
        }
      }
    } else if (exception instanceof Error) {
      // Errors raised by middleware (e.g. body-parser's 413 for an oversized body) carry an HTTP status.
      const carrier = exception as { status?: unknown; statusCode?: unknown };
      const httpStatus = carrier.status ?? carrier.statusCode;
      if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
        status = httpStatus;
        code = STATUS_CODES[status] ?? `HTTP_${status}`;
        message = status === HttpStatus.PAYLOAD_TOO_LARGE ? 'Илгээсэн өгөгдөл хэт том байна.' : 'Хүсэлт буруу байна.';
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
      if (!(exception instanceof HttpException)) {
        message = INTERNAL_MESSAGE;
      }
    }

    response.status(status).json({ success: false, error: message, code });
  }
}
