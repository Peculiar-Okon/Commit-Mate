import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from '@jest/globals';

import { ResponseValidator } from './response.validator';

describe('ResponseValidator', () => {
  let validator: ResponseValidator;

  beforeEach(() => {
    validator = new ResponseValidator();
  });

  it('should return a valid commit response', () => {
    const response = {
      title: 'feat(auth): add email verification',
      description: [
        'add verification email',
        'update auth flow',
      ],
    };

    expect(validator.validate(response)).toEqual(response);
  });

  it('should throw when title is missing', () => {
    const response = {
      description: [],
    };

    expect(() => validator.validate(response))
      .toThrow(BadRequestException);
  });

  it('should throw when description is not an array', () => {
    const response = {
      title: 'feat(auth): add email verification',
      description: 'invalid',
    };

    expect(() => validator.validate(response))
      .toThrow(BadRequestException);
  });

  it('should throw when title is empty', () => {
    const response = {
      title: '',
      description: [],
    };

    expect(() => validator.validate(response))
      .toThrow(BadRequestException);
  });

  it('should throw when description contains non-string values', () => {
    const response = {
      title: 'feat(auth): add email verification',
      description: [1, 2],
    };

    expect(() => validator.validate(response))
      .toThrow(BadRequestException);
  });
});