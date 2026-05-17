import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { HistoryEvent, HistoryEventSchema } from './schemas/history-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HistoryEvent.name, schema: HistoryEventSchema },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
