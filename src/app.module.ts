import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AIModule } from './AI/ai.module';
import { loggerConfig } from './common/logger/logger.config';
import openAIConfig from './config/openai.config';
import geminiConfig from './config/gemini.config';
import { RetryModule } from './common/retry/retry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
            openAIConfig,
            geminiConfig,
      ],
    }),

    LoggerModule.forRoot(loggerConfig),

    RetryModule,

    AIModule,
  ],
})
export class AppModule {}
