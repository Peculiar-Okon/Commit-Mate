import { Module } from '@nestjs/common';
import { CommitController } from './controllers/commit.controller';
import { CommitService } from './services/commit.service';
import { OpenAIService } from './providers/openai.service';
import { ResponseValidator } from './validator/response.validator';
import { AI_SERVICE } from './providers/ai.providers';
import { OpenAIClientProvider } from './providers/openai-client.provider';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { GeminiService } from './providers/gemini.service';
import { GeminiClientProvider } from './providers/gemini-client.provider';

@Module({
  controllers: [
    CommitController,
  ],

  providers: [
    CommitService,

    ResponseValidator,

    // AI Services
    OpenAIService,
    GeminiService,

    // SDK Clients
    OpenAIClientProvider,
    GeminiClientProvider,

    // Select which AI service to inject
    {
      provide: AI_SERVICE,

      inject: [
        ConfigService,
        OpenAIService,
        GeminiService,
      ],

      useFactory: (
        config: ConfigService,
        openAIService: OpenAIService,
        geminiService: GeminiService,
      ) => {
        const provider = config.get<string>('AI_PROVIDER');

        switch (provider) {
          case 'gemini':
            return geminiService;

          case 'openai':
          default:
            return openAIService;
        }
      },
    },
  ],
})
export class AIModule {}