import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// Fix BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('LTSventure Account System API')
    .setDescription('Banking account system — BCEL One style.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`\nServer:  http://localhost:${port}/api/v1`);
  console.log(`Swagger: http://localhost:${port}/docs\n`);
}
bootstrap();
