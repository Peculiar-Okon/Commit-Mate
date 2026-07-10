import { COMMIT_PROMPT_V1 } from './commits V1/v1.prompt';

export class PromptBuilder {
  static buildCommitPrompt(diff: string): string {
    return COMMIT_PROMPT_V1.replace('{{DIFF}}', diff);
  }
}