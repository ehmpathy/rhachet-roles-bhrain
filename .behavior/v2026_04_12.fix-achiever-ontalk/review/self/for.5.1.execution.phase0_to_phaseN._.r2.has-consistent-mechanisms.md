# review: has-consistent-mechanisms (r2)

## the question

do the new mechanisms duplicate extant functionality?

## investigation

### 1. `readStdin` reuse

```typescript
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();  // ✓ uses extant readStdin
  return parseStdinPrompt(raw);
};
```

**verdict**: extant mechanism reused.

### 2. `parseStdinPrompt` - new pure parser

searched for JSON parse utilities in the codebase:

```bash
grep -r "JSON.parse" src/
```

found no extant stdin JSON parser. `parseStdinPrompt` is a new pure function that:
- handles empty input
- handles malformed JSON
- extracts the `prompt` field specifically

**verdict**: no duplication. this is new functionality specific to Claude Code stdin format.

### 3. `OWL_WISDOM` reuse

```typescript
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);  // ✓ uses extant constant
  // ...
};
```

**verdict**: extant mechanism reused.

### 4. why not reuse `emitOwlHeader`?

extant `emitOwlHeader` uses `console.log` (stdout).
`emitOnTalkReminder` must use `console.error` (stderr).

the hook output goes to stderr so it doesn't interfere with brain stdout.
this is not duplication - it's a different output channel with different semantics.

### 5. why not reuse `emitSubBucket`?

extant `emitSubBucket` uses `console.log` (stdout).
the reminder output uses `console.error` (stderr).

same reason as above.

## extant inconsistency found (not introduced)

line 1018 duplicates the owl wisdom string:
```typescript
console.error('🦉 to forget an ask is to break a promise. remember.');
```

instead of:
```typescript
console.error(OWL_WISDOM);
```

this is pre-extant inconsistency, not one I introduced. my implementation correctly uses `OWL_WISDOM`.

## verdict

new mechanisms reuse extant utilities where appropriate. no duplication found.
