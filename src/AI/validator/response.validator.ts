import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

@Injectable()
export class ResponseValidator {
  validate(response: CommitResponse): CommitResponse {
    if (!response.title) {
      throw new BadRequestException('AI returned an empty commit title.');
    }

    if (!Array.isArray(response.description)) {
      throw new BadRequestException(
        'AI returned an invalid description array.',
      );
    }

    return response;
  }
}