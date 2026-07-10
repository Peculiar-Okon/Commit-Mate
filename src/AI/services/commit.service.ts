import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type { IAIService } from '../providers/ai.interface';
import { AI_SERVICE } from '../providers/ai.providers';

import { PromptBuilder } from '../prompts/prompt.builder';
import { ResponseValidator } from '../validator/response.validator';

@Injectable()
export class CommitService {
  constructor(
    @Inject(AI_SERVICE)
    private readonly aiService: IAIService,

    private readonly validator: ResponseValidator,

    private readonly logger: PinoLogger,
  ) {}

  async generateCommit(diff: string) {
    this.logger.info({
      event: 'commit.generation.started',
        diffLength: diff.length,
    });

    const prompt = PromptBuilder.buildCommitPrompt(diff);

    const response = await this.aiService.generateCommit(prompt);

    const validated = this.validator.validate(response);

    this.logger.info({
      event: 'commit.generation.completed',
      title: validated.title,
    });

    return validated;
  }
}