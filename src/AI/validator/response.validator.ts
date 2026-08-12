import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ZodError } from 'zod';

import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

@Injectable()
export class ResponseValidator {
  validate(response: unknown): CommitResponse {
    try {
      return CommitResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(
          'AI returned an invalid commit response.',
        );
      }

      throw error;
    }
  }
}
