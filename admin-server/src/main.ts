import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middlewares (Production Grade)
  app.use(helmet());
  app.use(cookieParser());
  app.use(hpp() as any);
  app.use(compression());

  app.enableCors({
    origin: [
      process.env.ADMIN_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Global Prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5052;
  await app.listen(port);
  console.log(`🚀 Admin Server running on: http://localhost:${port}/api`);
}
bootstrap();
