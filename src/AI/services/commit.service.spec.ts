import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { CommitService } from './commit.service';
import { ResponseValidator } from '../validator/response.validator';
import { AI_SERVICE } from '../providers/ai.providers';
import { CommitResponse } from '../contracts/commit-response.schema';

describe('CommitService', () => {
  let service: CommitService;

const mockAIService = {
  generateCommit: jest.fn<(prompt: string) => Promise<CommitResponse>>(),
};

const mockValidator = {
  validate: jest.fn<(value: unknown) => CommitResponse>(),
};

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommitService,

        {
          provide: AI_SERVICE,
          useValue: mockAIService,
        },

        {
          provide: ResponseValidator,
          useValue: mockValidator,
        },

        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get(CommitService);

    jest.clearAllMocks();
  });

  it('should generate a commit response', async () => {
    const diff = 'diff --git';

    const aiResponse = {
      title: 'feat(auth): add login',
      description: ['implement login'],
    };

    mockAIService.generateCommit.mockResolvedValue(aiResponse);

    const result = await service.generateCommit(diff);

    expect(mockAIService.generateCommit).toHaveBeenCalledTimes(1);

    expect(result).toEqual(aiResponse);
  });

  it('should call the AI with a generated prompt', async () => {
    const diff = 'diff --git';

    const aiResponse = {
      title: 'feat(auth): add login',
      description: [],
    };

    mockAIService.generateCommit.mockResolvedValue(aiResponse);

    mockValidator.validate.mockReturnValue(aiResponse);

    await service.generateCommit(diff);

    expect(mockAIService.generateCommit).toHaveBeenCalledWith(
      expect.stringContaining(diff),
    );

    });


  it('should throw when the AI service fails', async () => {
    mockAIService.generateCommit.mockRejectedValue(
      new Error('Gemini unavailable'),
    );

    await expect(
      service.generateCommit('diff'),
    ).rejects.toThrow('Gemini unavailable');
  });

  it('should log when generation starts', async () => {
    const aiResponse = {
      title: 'feat(auth): add login',
      description: [],
    };

    mockAIService.generateCommit.mockResolvedValue(aiResponse);

    mockValidator.validate.mockReturnValue(aiResponse);

    await service.generateCommit('diff');

    expect(mockLogger.info).toHaveBeenCalled();
  });

});