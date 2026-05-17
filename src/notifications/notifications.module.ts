import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email/email.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { DriversModule } from '../drivers/drivers.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { RentalsModule } from '../rentals/rentals.module';

@Module({
  imports: [
    ConfigModule,
    DriversModule,
    VehiclesModule,
    RentalsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, WhatsAppService],
  exports: [EmailService, WhatsAppService, NotificationsService],
})
export class NotificationsModule {}
