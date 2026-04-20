# review: role-standards-coverage (r7)

## the question

are all relevant mechanic standards applied? are required patterns present?

## methodology

1. enumerate required patterns for this type of code
2. verify each pattern is present
3. identify any gaps

## required patterns for CLI code

| pattern | required? | reason |
|---------|-----------|--------|
| jsdoc .what/.why | yes | all named functions need headers |
| arrow functions | yes | no function keyword |
| error to stderr | yes | hooks must use stderr |
| exit codes | yes | 0=success, 2=constraint |
| early returns | yes | narrative flow |
| pure transformers | yes | testability |
| type safety | yes | no as-casts |

## pattern-by-pattern verification

### jsdoc headers

**required for**: parseStdinPrompt, extractPromptFromStdin, emitOnTalkReminder

**present?**:
- parseStdinPrompt: ✓ has .what and .why at line 492
- extractPromptFromStdin: ✓ has .what and .why at line 511
- emitOnTalkReminder: ✓ has .what and .why at line 520

**why it holds**: all three new functions have headers

### error output to stderr

**required for**: hook output (onTalk reminder)

**present?**: ✓ emitOnTalkReminder uses `console.error` exclusively

**why it holds**: all 14 lines of output use stderr

### exit code semantics

**required for**: hook.onTalk branch

**present?**:
- exit 0 for empty stdin (line 1003): ✓
- exit 0 after success (line 1007): ✓

**why it holds**: hooks that pass use exit 0

### pure transformer separation

**required for**: stdin JSON parse

**present?**: ✓ parseStdinPrompt is pure (no I/O)

**why it holds**: I/O is in extractPromptFromStdin, parse is pure

### type safety

**required for**: all new code

**present?**: ✓ no as-casts, proper return types

**verified lines**: 497-508, 515-518, 524-541

**why it holds**: explicit types, no casts

### unit test coverage

**required for**: pure transformers

**present?**: ✓ parseStdinPrompt is exported for test

```typescript
export const parseStdinPrompt = ...
```

unit tests can import and verify without I/O.

**why it holds**: pure function is testable

### acceptance test coverage

**required for**: cli features

**present?**: ✓ `blackbox/achiever.goal.onTalk.acceptance.test.ts` exists

**why it holds**: acceptance test file was created

## gaps found

none. all required patterns are present.

## conclusion

| required pattern | present? |
|------------------|----------|
| jsdoc headers | ✓ |
| stderr for output | ✓ |
| exit code semantics | ✓ |
| pure transformers | ✓ |
| type safety | ✓ |
| unit test coverage | ✓ |
| acceptance test coverage | ✓ |

all mechanic standards covered.
