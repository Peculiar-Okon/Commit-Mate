import { Module } from '@nestjs/common';
import { CommitController } from './controllers/commit.controller';
import { CommitService } from './services/commit.service';
import { OpenAIService } from './providers/openai.service';
import { ResponseValidator } from './validator/response.validator';
import { AI_SERVICE } from './providers/ai.providers';
import { OpenAIClientProvider } from './providers/openai-client.provider';

@Module({
  controllers: [CommitController],

  providers: [
    CommitService,

    ResponseValidator,

    OpenAIClientProvider,

    {
      provide: AI_SERVICE,
      useClass: OpenAIService,
    },
  ],
})
export class AIModule {}