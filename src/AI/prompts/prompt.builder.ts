import { COMMIT_PROMPT } from './commit.prompt';

export class PromptBuilder {
  static buildCommitPrompt(diff: string): string {
    return COMMIT_PROMPT.replace('{{DIFF}}', diff);
  }
}