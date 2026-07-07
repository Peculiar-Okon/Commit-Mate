import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';

import { IAIService } from './ai.interface';
import { OPENAI_CLIENT } from './openai-client.provider';

import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

@Injectable()
export class OpenAIService implements IAIService {
  constructor(
    @Inject(OPENAI_CLIENT)
    private readonly client: OpenAI,

    private readonly config: ConfigService,

    private readonly logger: PinoLogger,
  ) {}

  async generateCommit(prompt: string): Promise<CommitResponse> {
    const start = Date.now();

    this.logger.info({
      event: 'ai.request',
      provider: 'openai',
    });

    try {
      const model = this.config.getOrThrow<string>('openai.model');

      const response = await this.client.responses.create({
        model,
        input: prompt,
      });

      const latency = Date.now() - start;

      this.logger.info({
        event: 'ai.response',
        provider: 'openai',
        model: response.model,
        latency,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
      });

      const parsed = JSON.parse(response.output_text);

      const commit = CommitResponseSchema.parse(parsed);

      return commit;
    } catch (error) {
      this.logger.error({
        event: 'ai.error',
        provider: 'openai',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}