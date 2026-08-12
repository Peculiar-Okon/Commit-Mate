import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_CLIENT = Symbol('GEMINI_CLIENT');

export const GeminiClientProvider: Provider = {
  provide: GEMINI_CLIENT,

  inject: [ConfigService],

  useFactory: (config: ConfigService) => {
    return new GoogleGenAI({
      apiKey: config.getOrThrow<string>('gemini.apiKey'),
    });
  },
};