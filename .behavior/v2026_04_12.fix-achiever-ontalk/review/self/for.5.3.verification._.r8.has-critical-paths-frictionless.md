# review: has-critical-paths-frictionless (r8)

## the question

are the critical paths frictionless in practice?

## context

this behavior has no repros artifact (3.2.distill.repros.experience.*.md). the critical path is defined in criteria (2.1.criteria.blackbox.yield.md):

> when the UserPromptSubmit hook fires:
> - ask appended to inventory
> - reminder emitted to stderr
> - hook exits 0

## verification approach

ran acceptance tests as the practical verification:
- tests invoke the real CLI via shell
- tests capture stdout, stderr, and exit code
- tests verify filesystem state after invocation

## test run

```
$ npm run test:acceptance -- achiever.goal.onTalk.acceptance.test.ts

Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
Snapshots:   2 passed, 2 total
Time:        39.798 s
```

## critical path verification

| step | what happens | friction? |
|------|--------------|-----------|
| stdin received | JSON parsed, prompt extracted | no |
| ask saved | appended to asks.inventory.jsonl | no |
| reminder emitted | owl header + message to stderr | no |
| exit | exits 0 | no |

## edge case verification

| edge case | behavior | friction? |
|-----------|----------|-----------|
| empty prompt | silent exit 0 | no |
| malformed JSON | silent exit 0 | no |
| multiline | preserved correctly | no |
| special chars | preserved correctly | no |

## why it holds

1. acceptance tests exercise the full CLI path
2. all 32 tests pass without errors
3. edge cases exit gracefully
4. no unexpected errors in test output
5. output format matches vision

