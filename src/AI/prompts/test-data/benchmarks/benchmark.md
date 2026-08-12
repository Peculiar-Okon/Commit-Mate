# CommitMate Prompt V1 Benchmark

## Evaluation Criteria

Every response is evaluated against the following rules.

### Correctness

- Correct Conventional Commit type.
- Appropriate scope.
- Title under 72 characters.
- Valid JSON.

### Grounding

- Every statement must be supported by the Git diff.
- No hallucinated functionality.
- No speculative benefits.

### Quality

- Title captures the dominant purpose.
- Description adds information beyond the title.
- Descriptions are concise.
- No duplicate information.

---

## Benchmark Cases

| Case | Type | Difficulty |
|------|------|------------|
| feat-email-verification | feat | Easy |
| fix-not-found | fix | Easy |
| docs-readme | docs | Easy |
| test-email-verification | test | Easy |
| refactor-rename | refactor | Easy |
| perf-map-lookup | perf | Medium |
| build-typescript-upgrade | build | Easy |
| build-eslint-prettier | build | Easy |
| ci-lint-workflow | ci | Medium |
| style-user-formatting | style | Easy |
| style-editorconfig-whitespace | style | Medium |
| chore-editorconfig | chore | Medium |
| chore-gitignore | chore | Easy |
| mixed-feature-docs | feat | Hard |
| multi-file-feature | feat | Hard |
| revert-email-verification | revert | Medium |