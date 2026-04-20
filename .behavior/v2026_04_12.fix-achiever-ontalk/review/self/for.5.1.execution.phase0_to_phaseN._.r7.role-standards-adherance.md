# review: role-standards-adherance (r7)

## the question

does the code follow mechanic role standards?

## methodology

1. enumerate all brief categories that apply to this code
2. for each category, read the rules
3. verify each changed line against applicable rules

## brief categories enumerated

from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

| category | applies? | reason |
|----------|----------|--------|
| code.prod/evolvable.procedures | yes | new functions |
| code.prod/readable.comments | yes | jsdoc headers |
| code.prod/readable.narrative | yes | control flow |
| code.prod/pitofsuccess.errors | yes | error patterns |
| code.prod/pitofsuccess.procedures | yes | idempotency |
| lang.terms | yes | term restrictions |
| lang.tones | yes | tone guidelines |

## line-by-line verification

### lines 497-508: parseStdinPrompt

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

**rules checked**:
- rule.require.arrow-only: ✓ arrow function
- rule.forbid.else-branches: ✓ no else
- rule.require.narrative-flow: ✓ early returns
- rule.forbid.as-cast: ✓ no casts
- rule.require.single-responsibility: ✓ single purpose

**why it holds**: pure transformer, early returns, no casts

### lines 515-518: extractPromptFromStdin

```typescript
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();
  return parseStdinPrompt(raw);
};
```

**rules checked**:
- rule.require.arrow-only: ✓
- rule.require.single-responsibility: ✓ composition only

**why it holds**: pure composition of two extant operations

### lines 524-541: emitOnTalkReminder

```typescript
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  // ... more console.error lines
};
```

**rules checked**:
- rule.require.arrow-only: ✓
- rule.forbid.stdout-on-exit-errors: ✓ uses stderr (console.error)
- rule.require.single-responsibility: ✓ emit only

**why it holds**: output function uses stderr correctly

### lines 1001-1008: hook.onTalk branch

```typescript
if (mode === 'hook.onTalk') {
  const prompt = extractPromptFromStdin();
  if (!prompt) process.exit(0);
  await setAsk({ content: prompt, scopeDir });
  emitOnTalkReminder(prompt);
  process.exit(0);
}
```

**rules checked**:
- rule.require.narrative-flow: ✓ flat, linear
- rule.forbid.else-branches: ✓ no else
- rule.require.failfast: ✓ early exit for invalid input
- rule.require.exit-code-semantics: ✓ exit 0 for success

**why it holds**: flat structure, early exit pattern, correct exit code

### jsdoc headers

**rule.require.what-why-headers**: all three new functions have `.what` and `.why`

verified at lines 492-495, 511-514, 520-523

**why it holds**: consistent with extant pattern in file

## issues found

none.

## conclusion

| rule category | violations | status |
|---------------|------------|--------|
| evolvable.procedures | 0 | ✓ |
| readable.comments | 0 | ✓ |
| readable.narrative | 0 | ✓ |
| pitofsuccess.errors | 0 | ✓ |
| pitofsuccess.procedures | 0 | ✓ |
| lang.terms | 0 | ✓ |
| lang.tones | 0 | ✓ |

all mechanic role standards followed. no violations found.
