import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      service: 'goaylal-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
