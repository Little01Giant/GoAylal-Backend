import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema.js';
import { DestinationsModule } from '../destinations/destinations.module.js';
import { AiPlannerService } from './ai-planner.service.js';
import { AiPlannerController } from './ai-planner.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    DestinationsModule,
  ],
  controllers: [AiPlannerController],
  providers: [AiPlannerService],
  exports: [AiPlannerService],
})
export class AiPlannerModule {}
