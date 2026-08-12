import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');

export const OpenAIClientProvider: Provider = {
  provide: OPENAI_CLIENT,

  inject: [ConfigService],

  useFactory: (config: ConfigService) => {
    return new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
  },
};