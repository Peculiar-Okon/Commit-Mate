import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { beforeAll, afterAll, describe, expect, it, jest, beforeEach } from '@jest/globals';

import { AIModule } from './ai.module';
import { AI_SERVICE } from './providers/ai.providers';
import { GEMINI_CLIENT } from './providers/gemini-client.provider';
import { OPENAI_CLIENT } from './providers/openai-client.provider';
import { RetryModule } from '../common/retry/retry.module';

describe('Commit API (integration)', () => {
  let app: INestApplication;

  const mockAIService = {
    generateCommit: jest.fn<(prompt: string) => Promise<{ title: string; description: string[] }>>(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule =
      await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [],
          }),
          LoggerModule.forRoot({
            pinoHttp: {
              level: 'silent',
              autoLogging: false,
            },
          }),
          RetryModule,
          AIModule,
        ],
      })
        .overrideProvider(AI_SERVICE)
        .useValue(mockAIService)
        .overrideProvider(GEMINI_CLIENT)
        .useValue({} as never)
        .overrideProvider(OPENAI_CLIENT)
        .useValue({} as never)
        .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a commit message', async () => {
    mockAIService.generateCommit.mockResolvedValue({
      title: 'feat(auth): add email verification',
      description: [
        'send verification email after registration',
      ],
    });

    const response = await supertest(app.getHttpServer())
      .post('/commits/generate')
      .send({
        diff: `
diff --git a/auth.service.ts b/auth.service.ts
+ send verification email
`,
      })
      .expect(201);

    expect(response.body).toEqual({
      title: 'feat(auth): add email verification',
      description: [
        'send verification email after registration',
      ],
    });

    expect(mockAIService.generateCommit).toHaveBeenCalledTimes(1);
  });

  it('should reject an invalid request body', async () => {
    await supertest(app.getHttpServer())
      .post('/commits/generate')
      .send({})
      .expect(400);
  });

  it('should reject an empty diff', async () => {
    await supertest(app.getHttpServer())
      .post('/commits/generate')
      .send({
        diff: '',
      })
      .expect(400);
  });

  it('should return 500 when the AI service throws', async () => {
    mockAIService.generateCommit.mockRejectedValue(
      new Error('Gemini unavailable'),
    );

    await supertest(app.getHttpServer())
      .post('/commits/generate')
      .send({
        diff: 'diff --git',
      })
      .expect(500);
  });
});