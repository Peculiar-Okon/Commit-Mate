import { describe, expect, it } from '@jest/globals';
import { CommitResponseSchema } from './commit-response.schema';

describe('CommitResponseSchema', () => {
  it('accepts valid JSON', () => {
    const response = {
      title: 'feat(auth): add email verification',
      description: [
        'send verification email after signup',
      ],
    };

    expect(() =>
      CommitResponseSchema.parse(response),
    ).not.toThrow();
  });

  it('rejects missing title', () => {
    const response = {
      description: [
        'send verification email',
      ],
    };

    expect(() =>
      CommitResponseSchema.parse(response),
    ).toThrow();
  });

  it('rejects missing description', () => {
    const response = {
      title: 'feat(auth): add email verification',
    };

    expect(() =>
      CommitResponseSchema.parse(response),
    ).toThrow();
  });

  it('rejects invalid description type', () => {
    const response = {
      title: 'feat(auth): add email verification',
      description: 'send verification email',
    };

    expect(() =>
      CommitResponseSchema.parse(response),
    ).toThrow();
  });
});