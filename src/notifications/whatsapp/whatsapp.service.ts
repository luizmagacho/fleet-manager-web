import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

export interface WhatsAppPayload {
  to: string;
  message: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private client: twilio.Twilio;
  private readonly fromNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not configured — WhatsApp notifications disabled.');
    }
  }

  async send(payload: WhatsAppPayload): Promise<void> {
    if (!this.client) {
      this.logger.warn(`WhatsApp [MOCK] to ${payload.to}: ${payload.message}`);
      return;
    }

    try {
      const toFormatted = payload.to.startsWith('whatsapp:')
        ? payload.to
        : `whatsapp:+55${payload.to.replace(/\D/g, '')}`;

      await this.client.messages.create({
        from: this.fromNumber,
        to: toFormatted,
        body: payload.message,
      });

      this.logger.log(`WhatsApp enviado para: ${payload.to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar WhatsApp: ${error.message}`);
      throw error;
    }
  }

  async sendPaymentOverdueAlert(driverName: string, phone: string, plate: string, amount: number): Promise<void> {
    await this.send({
      to: phone,
      message: `⚠️ *GestorFrota PR* — Olá, ${driverName}!\n\nSeu pagamento de *R$ ${amount.toFixed(2)}* referente ao veículo *${plate}* está atrasado.\n\nRegularize sua situação para evitar suspensão do contrato.\n\nDúvidas? Responda esta mensagem. 🚗`,
    });
  }

  async sendLicenseExpirationWarning(driverName: string, phone: string, daysLeft: number): Promise<void> {
    await this.send({
      to: phone,
      message: `🔔 *GestorFrota PR* — Olá, ${driverName}!\n\nSua CNH vence em *${daysLeft} dias*.\n\nNão esqueça de renová-la para continuar operando normalmente! ✅`,
    });
  }

  async sendDocumentExpirationAlert(phone: string, plate: string, documentType: string, daysLeft: number): Promise<void> {
    const labels: Record<string, string> = {
      ipva: 'IPVA',
      licensing: 'Licenciamento',
      insurance: 'Seguro',
    };

    await this.send({
      to: phone,
      message: `📋 *GestorFrota PR* — O *${labels[documentType] ?? documentType}* do veículo *${plate}* vence em *${daysLeft} dias*.\n\nProvidencie a regularização. 🛡️`,
    });
  }

  async sendFineAlert(phone: string, plate: string, description: string, amount: number): Promise<void> {
    await this.send({
      to: phone,
      message: `🚨 *GestorFrota PR* — Nova multa detectada no veículo *${plate}*!\n\n*Infração:* ${description}\n*Valor:* R$ ${amount.toFixed(2)}\n\nVerifique no aplicativo para mais detalhes.`,
    });
  }
}
