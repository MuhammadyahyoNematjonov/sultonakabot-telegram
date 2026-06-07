import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { SessionService } from './session.service';

@Module({
  providers: [BotUpdate, SessionService],
})
export class BotModule {}
