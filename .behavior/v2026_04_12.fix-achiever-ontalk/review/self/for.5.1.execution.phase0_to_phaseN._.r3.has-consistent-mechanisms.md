# review: has-consistent-mechanisms (r3)

## the question

do the new mechanisms duplicate extant functionality?

## methodology

1. listed all new mechanisms introduced
2. searched codebase for similar patterns
3. evaluated reuse vs new implementation

## new mechanisms introduced

1. `parseStdinPrompt` - pure JSON parser for stdin
2. `extractPromptFromStdin` - wrapper that combines I/O + parse
3. `emitOnTalkReminder` - stderr output formatter

## investigation: parseStdinPrompt

### search: extant JSON parsers

```bash
grep -rn "JSON.parse" src/contract/cli/
```

results:
- goal.ts:502 (my new code)
- goal.ts:609 (extant goalMemorySet, parses YAML/JSON)

### analysis

the extant JSON parse in `goalMemorySet` (line 609) parses goal YAML/JSON, not stdin prompt format.

`parseStdinPrompt` is specific to Claude Code hook stdin format:
```json
{"prompt": "user message"}
```

this is a distinct format from goal YAML. no reuse opportunity.

## investigation: extractPromptFromStdin

### analysis

reuses extant `readStdin()` function (line 475).
composes it with new `parseStdinPrompt`.

**reuse confirmed**: uses extant I/O primitive.

## investigation: emitOnTalkReminder

### search: extant stderr emitters

```bash
grep -n "console.error" src/contract/cli/goal.ts
```

results: lines 525, 527-540, 1018-1050, 1189, 1290

### analysis

extant stderr patterns:
- `emitOwlHeader` - stdout only (line 37-40)
- `emitSubBucket` - stdout only (line 47-55)
- hook.onStop - inline console.error (1018-1050)

none provide a reusable stderr variant.

the hook.onStop branch (lines 1018-1050) uses inline `console.error` statements, not a reusable function. this is the same pattern I followed for hook.onTalk.

**consistency confirmed**: matches extant hook branch pattern.

### why not extract a reusable stderr helper?

this would be over-abstraction for one use case. the hook.onStop branch doesn't use a helper either. consistency with extant code > premature abstraction.

## found issue: OWL_WISDOM duplication (pre-extant)

line 1018:
```typescript
console.error('🦉 to forget an ask is to break a promise. remember.');
```

should be:
```typescript
console.error(OWL_WISDOM);
```

**note**: this is pre-extant inconsistency. my implementation correctly uses `OWL_WISDOM` (line 525).

## verdict

new mechanisms:
- reuse extant utilities where available (`readStdin`, `OWL_WISDOM`)
- follow extant patterns where no reusable utility exists (inline stderr)
- no duplication introduced
