# review: has-consistent-conventions (r3)

## the question

do the new names and patterns diverge from extant conventions?

## methodology

1. extracted extant function name patterns from goal.ts
2. compared new function names against patterns
3. evaluated structure and namespace consistency

## extant name patterns

from grep analysis of goal.ts:

| pattern | examples |
|---------|----------|
| `emit*` | `emitOwlHeader`, `emitSubBucket`, `emitGoalFull`, `emitGoalCondensed` |
| `parse*` | `parseStdinValues`, `parseArgsForSet`, `parseArgsForGet`, `parseArgsForTriage` |
| `get*` | `getDefaultScope`, `getScopeDir` |
| `read*` | `readStdin` |
| `build*` | `buildGoalFromFlags` |
| `goal*` | `goalMemorySet`, `goalMemoryGet`, `goalTriageInfer`, `goalGuard` |

## new function names

### `parseStdinPrompt`

- follows `parse*` pattern ✓
- similar to `parseStdinValues`, `parseArgsForTriage`
- camelCase consistent ✓

### `extractPromptFromStdin`

- no exact `extract*` precedent, but...
- the verb `extract` is appropriate (pulls data from stream)
- `*FromStdin` suffix is descriptive
- could also be `getPromptFromStdin` to match `get*` pattern
- **decision**: acceptable, verb is clear

### `emitOnTalkReminder`

- follows `emit*` pattern ✓
- similar to `emitOwlHeader`, `emitGoalFull`
- camelCase consistent ✓

## mode value names

### `'hook.onTalk'`

- matches extant `'hook.onStop'` pattern ✓
- dot-separated namespace consistent ✓
- camelCase after dot consistent ✓

## file names

### acceptance test file

`achiever.goal.onTalk.acceptance.test.ts`

- follows extant pattern: `achiever.goal.*.acceptance.test.ts`
- matches `achiever.goal.triage.acceptance.test.ts`, etc.

## verdict

all new names follow extant conventions:
- `parse*` for parsers
- `emit*` for output formatters
- `hook.onX` for hook modes
- `achiever.goal.*.acceptance.test.ts` for test files

no divergence from extant conventions found.
