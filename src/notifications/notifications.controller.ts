import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class TestNotificationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  @ApiOperation({ summary: 'Enviar notificação de teste (e-mail + WhatsApp)' })
  sendTest(@Body() dto: TestNotificationDto) {
    return this.notificationsService.sendTestNotification(dto.email, dto.phone);
  }

  @Get('in-app')
  @ApiOperation({ summary: 'Recuperar notificações in-app do usuário logado' })
  getInAppNotifications() {
    return this.notificationsService.getInAppNotifications();
  }
}
