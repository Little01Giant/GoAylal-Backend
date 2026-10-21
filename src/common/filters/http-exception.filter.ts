import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Серверт тодорхойгүй алдаа гарлаа. Дахин оролдоно уу.';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorObj = res as { message?: unknown; error?: unknown };
        if (Array.isArray(errorObj.message)) {
          message = errorObj.message.map((m) => String(m)).join(', ');
        } else if (typeof errorObj.message === 'string') {
          message = errorObj.message;
        }
        code = typeof errorObj.error === 'string' ? errorObj.error : `HTTP_${status}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: message,
      code,
    });
  }
}
