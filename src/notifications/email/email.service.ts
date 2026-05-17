import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async send(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"GestorFrota PR" <${this.configService.get('SMTP_FROM', 'noreply@gestorfrota.com.br')}>`,
        to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      this.logger.log(`E-mail enviado para: ${payload.to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail: ${error.message}`);
      throw error;
    }
  }

  async sendPaymentOverdue(driverName: string, driverEmail: string, plate: string, amount: number, daysOverdue: number): Promise<void> {
    await this.send({
      to: driverEmail,
      subject: `⚠️ Pagamento Atrasado - Veículo ${plate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #D12027; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">GestorFrota PR</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Olá, <strong>${driverName}</strong>!</p>
            <p>Identificamos um pagamento em atraso de <strong>R$ ${amount.toFixed(2)}</strong> referente ao aluguel do veículo <strong>${plate}</strong>.</p>
            <p>Atraso: <strong>${daysOverdue} dias</strong></p>
            <div style="background: #fff3cd; padding: 16px; border-radius: 6px; border-left: 4px solid #D12027; margin: 16px 0;">
              <strong>Regularize sua situação o quanto antes para evitar suspensão do contrato.</strong>
            </div>
            <p>Entre em contato conosco pelo WhatsApp ou telefone para mais informações.</p>
          </div>
        </div>
      `,
    });
  }

  async sendLicenseExpirationWarning(driverName: string, driverEmail: string, daysLeft: number): Promise<void> {
    await this.send({
      to: driverEmail,
      subject: `🔔 CNH vencendo em ${daysLeft} dias`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #D12027; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">GestorFrota PR</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Olá, <strong>${driverName}</strong>!</p>
            <p>Sua CNH vence em <strong>${daysLeft} dias</strong>. Não esqueça de renová-la!</p>
            <p>Motoristas com CNH vencida não podem operar veículos da frota.</p>
          </div>
        </div>
      `,
    });
  }

  async sendDocumentExpirationAlert(email: string, plate: string, documentType: string, daysLeft: number): Promise<void> {
    const labels: Record<string, string> = {
      ipva: 'IPVA',
      licensing: 'Licenciamento',
      insurance: 'Seguro',
    };

    await this.send({
      to: email,
      subject: `📋 ${labels[documentType] ?? documentType} do veículo ${plate} vencendo em ${daysLeft} dias`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #D12027; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">GestorFrota PR</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Atenção! O <strong>${labels[documentType]}</strong> do veículo <strong>${plate}</strong> vence em <strong>${daysLeft} dias</strong>.</p>
            <p>Providencie a regularização para evitar problemas legais.</p>
          </div>
        </div>
      `,
    });
  }
}
