import { Module } from '@nestjs/common';
import { DetranController } from './detran.controller';
import { DetranService } from './detran.service';

@Module({
  controllers: [DetranController],
  providers: [DetranService],
  exports: [DetranService],
})
export class DetranModule {}
