
import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RetryService {
  constructor(
    private readonly logger: PinoLogger,
  ) {}

  private readonly maxRetries = 3;

  async execute<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt === this.maxRetries) {
          break;
        }

        const delay = this.getDelay(attempt);

        this.logger.warn({
          event: 'retry.attempt',
          attempt,
          maxRetries: this.maxRetries,
          delay,
          error:
            error instanceof Error
              ? error.message
              : 'Unknown error',
        });

        await this.sleep(delay);
      }
    }

    this.logger.error({
      event: 'retry.failed',
      maxRetries: this.maxRetries,
      error:
        lastError instanceof Error
          ? lastError.message
          : 'Unknown error',
    });

    throw new ServiceUnavailableException(
      'The AI service is temporarily unavailable. Please try again.',
    );
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    return (
      message.includes('429') ||
      message.includes('resource_exhausted') ||
      message.includes('quota') ||
      message.includes('503') ||
      message.includes('unavailable') ||
      message.includes('high demand') ||
      message.includes('timeout') ||
      message.includes('etimedout')
    );
  }

  private getDelay(attempt: number): number {
    return 1000 * Math.pow(2, attempt - 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}