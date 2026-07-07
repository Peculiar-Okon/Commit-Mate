import {
  CommitResponse,
  CommitResponseSchema,
} from '../contracts/commit-response.schema';

export interface IAIService {
  generateCommit(prompt: string): Promise<CommitResponse>;
}