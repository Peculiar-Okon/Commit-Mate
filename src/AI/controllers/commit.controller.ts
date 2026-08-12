import { Body, Controller, Post } from '@nestjs/common';

import { CommitService } from '../services/commit.service';
import { GenerateDto } from '../dto/generate.dto';
import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

@Controller('commits')
export class CommitController {
  constructor(
    private readonly commitService: CommitService,
  ) {}

  @Post('generate')
  async generate(
    @Body() dto: GenerateDto,
  ): Promise<CommitResponse> {
    return this.commitService.generateCommit(dto.diff);
  }
}