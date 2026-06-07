import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { DatabaseModule } from './database/database.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN!,
      }),
    }),
    DatabaseModule,
    BotModule,
  ],
})
export class AppModule {}
