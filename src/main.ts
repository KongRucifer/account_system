import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('LTSventure Account System API')
    .setDescription(
      'Banking account system — BCEL One style.\n\n' +
        '**How to use Swagger with JWT:**\n' +
        '1. Call `POST /api/v1/auth/login` to get your `accessToken`.\n' +
        '2. Click **Authorize 🔒** above and paste the token value.\n' +
        '3. Protected endpoints will now include the Bearer header automatically.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Paste your JWT access token here (without "Bearer ")',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\nServer:  http://localhost:${port}/api/v1`);
  console.log(`Swagger: http://localhost:${port}/docs\n`);
}
bootstrap();
