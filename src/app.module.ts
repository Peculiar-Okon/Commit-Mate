// import { Module } from '@nestjs/common';
// import { LoggerModule } from 'nestjs-pino';
// import { AIModule } from './AI/ai.module';
// import { loggerConfig } from './common/logger/logger.config';
// import { ConfigModule } from '@nestjs/config';
// import  openAIConfig  from './Config/openai.config';

// @Module({
//   imports: [
//     LoggerModule.forRoot(loggerConfig),
//     AIModule,

//       ConfigModule.forRoot({
//     isGlobal: true,
//     load: [openAIConfig],
//   }),
//   ],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { AIModule } from './AI/ai.module';
import { loggerConfig } from './common/logger/logger.config';
import openAIConfig from './config/openai.config';
import geminiConfig from './config/gemini.config';

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

    AIModule,
  ],
})
export class AppModule {}
