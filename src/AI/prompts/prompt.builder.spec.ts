import { PromptBuilder } from './prompt.builder';
import { describe, expect, it } from '@jest/globals';

describe('PromptBuilder', () => {
  const diff = `
diff --git a/auth.ts b/auth.ts
+ add email verification
`;

  describe('buildCommitPrompt', () => {
    it('should replace the diff placeholder', () => {
      const prompt = PromptBuilder.buildCommitPrompt(diff);

      expect(prompt).toContain(diff);
    });

    it('should remove the placeholder', () => {
      const prompt = PromptBuilder.buildCommitPrompt(diff);

      expect(prompt).not.toContain('{{DIFF}}');
    });

    it('should include Conventional Commit instructions', () => {
      const prompt = PromptBuilder.buildCommitPrompt(diff);

      expect(prompt).toContain('Conventional Commit');
    });

    it('should instruct the AI to return JSON only', () => {
      const prompt = PromptBuilder.buildCommitPrompt(diff);

      expect(prompt).toContain('Return only valid JSON');
    });

    it('should include the Git Diff section', () => {
      const prompt = PromptBuilder.buildCommitPrompt(diff);

      expect(prompt).toContain('Git Diff:');
    });
  });
});