import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config(); // ← ENG BIRINCHI, hamma narsadan oldin

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  await app.init();
  console.log('🤖 Telegram bot ishga tushdi!');
}

bootstrap();
