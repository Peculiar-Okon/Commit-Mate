# Prompt V1 Results

| Test | Status | Notes |
|------|--------|-------|
| feat-email-verification | ✅ | Stable |
| fix-not-found | ✅ | Stable after prompt refinement |
| docs-readme | ✅ | Stable |
| test-email-verification | ✅ | Stable |
| refactor-rename | ✅ | Stable |
| perf-map-lookup | ✅ | Correctly preferred perf over refactor |
| build-typescript-upgrade | ✅ | Stable |
| build-eslint-prettier | ✅ | Stable |
| ci-lint-workflow | ✅ | Stable |
| style-user-formatting | ✅ | Stable |
| style-editorconfig-whitespace | ⚠️ | Occasionally infers trailing newline |
| chore-editorconfig | ⚠️ | Sometimes classified as style |
| chore-gitignore | ✅ | Stable |
| mixed-feature-docs | ✅ | Correctly prioritizes feature |
| multi-file-feature | ✅ | Good summarization |
| revert-email-verification | Pending | Needs additional validation |

---

## Summary

Prompt Version: V1

Total Benchmarks: 16

Passed: 13

Known Edge Cases: 2

Pending: 1

Overall Assessment:

- Strong Conventional Commit classification.
- Excellent scope inference.
- Reliable grounding.
- Consistent JSON output.
- Minor ambiguity around `style` vs `chore` for `.editorconfig`.