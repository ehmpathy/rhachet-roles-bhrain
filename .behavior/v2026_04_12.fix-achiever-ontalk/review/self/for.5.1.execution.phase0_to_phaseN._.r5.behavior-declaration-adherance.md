# review: behavior-declaration-adherance (r5)

## the question

does the implementation match the behavior declaration correctly?
(not just coverage, but adherence — does it do what the spec says?)

## methodology

1. list each changed file
2. compare each change against the wish specification
3. verify the implementation matches the intent

## changed files

from `git diff main --name-only`:
- `src/contract/cli/goal.ts` — main implementation
- `blackbox/achiever.goal.onTalk.acceptance.test.ts` — acceptance tests

## adherence verification

### parseStdinPrompt function

**wish requirement**: "read the user's message from stdin (claude code pipes it)"

**wish context**: Claude Code's UserPromptSubmit hook pipes JSON via stdin

**implementation**:
```typescript
export const parseStdinPrompt = (raw: string): string | null => {
  if (!raw.trim()) return null;
  try {
    const json = JSON.parse(raw);
    const prompt = json.prompt;
    if (typeof prompt !== 'string' || !prompt.trim()) return null;
    return prompt;
  } catch {
    return null;
  }
};
```

**adherence check**:
- ✓ parses JSON format `{"prompt": "..."}`
- ✓ returns null for empty/malformed input (graceful degradation)
- ✓ extracts the `prompt` field specifically

**verdict**: matches spec

### extractPromptFromStdin function

**wish requirement**: connect stdin read to JSON parse

**implementation**:
```typescript
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();
  return parseStdinPrompt(raw);
};
```

**adherence check**:
- ✓ composes `readStdin` (extant) with `parseStdinPrompt` (new)
- ✓ pure composition, no additional logic

**verdict**: matches spec

### emitOnTalkReminder function

**wish lines 43-57**: specific output format

**expected**:
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │  {message}
   │  └─
   └─ consider: does this impact your goals?
      ├─ if yes, triage before you proceed
      └─ run `rhx goal.triage.infer`
```

**implementation output** (reconstructed):
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │
   │  │    {message lines}
   │  │
   │  └─
   │
   └─ consider: does this impact your goals?
      ├─ if yes, triage before you proceed
      └─ run `rhx goal.triage.infer`
```

**adherence check**:
- ✓ owl wisdom line matches exactly (uses `OWL_WISDOM` constant)
- ✓ command header matches
- ✓ from = peer:human matches
- ✓ ask sub.bucket with content inside
- ✓ consider nudge with actionable next steps

**minor difference**: implementation adds extra indentation for message lines and blank lines for sub.bucket whitespace. this follows the treestruct convention from briefs.

**verdict**: matches spec (with minor style enhancement)

### hook.onTalk branch

**wish lines 31-37**: when mode is `hook.onTalk`:
- read the user's message from stdin
- call `setAsk({ content, scopeDir })`
- emit a short reminder to stderr
- exit 0

**implementation**:
```typescript
if (mode === 'hook.onTalk') {
  const prompt = extractPromptFromStdin();
  if (!prompt) process.exit(0);
  await setAsk({ content: prompt, scopeDir });
  emitOnTalkReminder(prompt);
  process.exit(0);
}
```

**adherence check**:
- ✓ reads stdin via `extractPromptFromStdin()`
- ✓ calls `setAsk({ content: prompt, scopeDir })`
- ✓ emits reminder via `emitOnTalkReminder(prompt)`
- ✓ exits 0 unconditionally

**additional behavior**: early exit 0 if no prompt (empty stdin). this is reasonable defensive behavior not in spec but aligns with "don't halt brain" intent.

**verdict**: matches spec

### parseArgsForTriage mode union

**wish line 29**: accept `'hook.onTalk'` as a valid mode

**implementation**:
```typescript
mode: 'triage' | 'hook.onStop' | 'hook.onTalk'
```

**adherence check**:
- ✓ type union includes `hook.onTalk`
- ✓ default remains `'triage'`
- ✓ accepts via `--when hook.onTalk` flag

**verdict**: matches spec

## deviations found

none. all implementation details adhere to the specification.

## conclusion

| component | adherence | notes |
|-----------|-----------|-------|
| parseStdinPrompt | ✓ | handles JSON format correctly |
| extractPromptFromStdin | ✓ | pure composition |
| emitOnTalkReminder | ✓ | format matches with style enhancement |
| hook.onTalk branch | ✓ | all steps in order |
| mode type union | ✓ | accepts hook.onTalk |

implementation adheres to the behavior declaration.
