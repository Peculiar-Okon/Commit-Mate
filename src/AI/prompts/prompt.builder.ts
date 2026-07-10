import { COMMIT_PROMPT } from './commits/v1.prompt';

export class PromptBuilder {
  static buildCommitPrompt(diff: string): string {
    return COMMIT_PROMPT.replace('{{DIFF}}', diff);
  }
}