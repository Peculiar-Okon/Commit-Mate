import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ZodError } from 'zod';

export class GeminiErrorHandler {
  static handle(error: unknown): never {
    // Zod validation failed
    if (error instanceof ZodError) {
      throw new BadGatewayException(
        'The AI response did not match the expected schema.',
      );
    }

    // JSON.parse failed
    if (error instanceof SyntaxError) {
      throw new BadGatewayException(
        'The AI returned invalid JSON.',
      );
    }

    if (error instanceof Error) {
      const message = error.message;

      // Free-tier quota exceeded
      if (
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota')
      ) {
throw new HttpException(
  'Gemini quota exceeded. Please try again later.',
  HttpStatus.TOO_MANY_REQUESTS,
);
      }

      // Model overloaded
      if (
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('high demand')
      ) {
        throw new ServiceUnavailableException(
          'Gemini is temporarily unavailable. Please retry shortly.',
        );
      }

      // Timeout
      if (
        message.includes('timeout') ||
        message.includes('ETIMEDOUT')
      ) {
        throw new GatewayTimeoutException(
          'Gemini request timed out.',
        );
      }

      // Model not found
      if (
        message.includes('404') ||
        message.includes('NOT_FOUND')
      ) {
        throw new BadGatewayException(
          'The configured Gemini model is unavailable.',
        );
      }

      // Invalid API key
      if (
        message.includes('401') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('API key')
      ) {
        throw new BadGatewayException(
          'Gemini authentication failed.',
        );
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate commit message.',
    );
  }
}