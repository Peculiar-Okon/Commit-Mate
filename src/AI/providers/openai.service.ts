import {
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import { ZodError } from 'zod';

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
    console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
    console.log('CONFIG_MODEL:', this.config.get('openai.model'));
    const model = this.config.getOrThrow<string>('openai.model');
    const start = Date.now();

    this.logger.info({
      event: 'ai.request',
      provider: 'openai',
      model,
    });

    try {
      const response = await this.client.responses.create({
        model,
        input: prompt,
      });

      const latency = Date.now() - start;

      this.logger.info({
        event: 'ai.response',
        provider: 'openai',
        model: response.model,
        requestId: response._request_id,
        latency,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        totalTokens: response.usage?.total_tokens,
      });

      const raw = response.output_text;

      if (!raw.trim()) {
        throw new BadGatewayException(
          'The AI returned an empty response.',
        );
      }

      this.logger.debug({
        event: 'ai.response.received',
        responseLength: raw.length,
      });

      const parsed = JSON.parse(raw);

      const commit = CommitResponseSchema.parse(parsed);

      return commit;
    } catch (error) {
      this.logger.error({
        event: 'ai.error',
        provider: 'openai',
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        throw new BadGatewayException(
          `OpenAI API request failed (${error.status}).`,
        );
      }

      if (error instanceof SyntaxError) {
        throw new BadGatewayException(
          'The AI returned invalid JSON.',
        );
      }

      if (error instanceof ZodError) {
        throw new BadGatewayException(
          'The AI response did not match the expected schema.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate commit message.',
      );
    }
  }
}