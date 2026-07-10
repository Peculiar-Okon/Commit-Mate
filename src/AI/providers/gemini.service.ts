import {
  BadGatewayException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PinoLogger } from 'nestjs-pino';
import { ZodError } from 'zod';

import { IAIService } from './ai.interface';
import { GEMINI_CLIENT } from './gemini-client.provider';

import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

@Injectable()
export class GeminiService implements IAIService {
  constructor(
    @Inject(GEMINI_CLIENT)
    private readonly client: GoogleGenAI,

    private readonly config: ConfigService,

    private readonly logger: PinoLogger,
  ) {}

  async generateCommit(
    prompt: string,
  ): Promise<CommitResponse> {
    const start = Date.now();

    const model =
      this.config.getOrThrow<string>('gemini.model');

    this.logger.info({
      event: 'ai.request',
      provider: 'gemini',
      model,
    });

    try {
      const response =
        await this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

      const latency = Date.now() - start;

      this.logger.info({
        event: 'ai.response',
        provider: 'gemini',
        model,
        latency,
      });

      const raw = response.text ?? '';

      if (!raw.trim()) {
        throw new BadGatewayException(
          'Gemini returned an empty response.',
        );
      }

      const parsed = JSON.parse(raw);

      return CommitResponseSchema.parse(parsed);
    } catch (error) {
      this.logger.error({
        event: 'ai.error',
        provider: 'gemini',
        model,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      });

      if (error instanceof SyntaxError) {
        throw new BadGatewayException(
          'Gemini returned invalid JSON.',
        );
      }

      if (error instanceof ZodError) {
        throw new BadGatewayException(
          'Gemini response failed schema validation.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate commit message.',
      );
    }
  }
}