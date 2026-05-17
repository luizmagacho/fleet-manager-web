import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('GestorFrota PR — API')
    .setDescription('API de gestão de frota de veículos para motoristas de aplicativo no Paraná')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Autenticação')
    .addTag('Motoristas')
    .addTag('Veículos')
    .addTag('Aluguéis')
    .addTag('Manutenções')
    .addTag('Detran PR')
    .addTag('Notificações')
    .addTag('Histórico')
    .addTag('Relatórios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 GestorFrota PR API rodando em: http://localhost:${port}/api`);
  console.log(`📖 Swagger disponível em: http://localhost:${port}/api/docs`);
}
bootstrap();
