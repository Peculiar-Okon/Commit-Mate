import OpenAI from 'openai';

import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OPENAI_CLIENT } from './openai-client.provider';

export const OpenAIClientProvider: Provider = {
  provide: OPENAI_CLIENT,

  inject: [ConfigService],

  useFactory: (config: ConfigService) => {
    return new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
  },
};