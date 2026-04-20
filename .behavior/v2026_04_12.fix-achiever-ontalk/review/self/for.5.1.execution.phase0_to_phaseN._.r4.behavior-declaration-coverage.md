# review: behavior-declaration-coverage (r4)

## the question

does the implementation cover all requirements from the behavior declaration?

## acceptance criteria from wish

### 1. `goal.triage.infer --when hook.onTalk` reads stdin and calls `setAsk`

**location**: `src/contract/cli/goal.ts:1001-1005`

```typescript
if (mode === 'hook.onTalk') {
  const prompt = extractPromptFromStdin();
  if (!prompt) process.exit(0);
  await setAsk({ content: prompt, scopeDir });
```

- `extractPromptFromStdin()` reads stdin and parses JSON
- `setAsk()` is called with the prompt content

**verdict**: ✓ covered

### 2. ask is appended to `asks.inventory.jsonl` with content hash

**location**: `src/domain.operations/goal/setAsk.ts`

the `setAsk` function:
- computes content hash
- appends to `asks.inventory.jsonl`
- is called from the hook.onTalk branch

**verdict**: ✓ covered (via setAsk)

### 3. output is a short reminder (not full triage state)

**location**: `src/contract/cli/goal.ts:524-541`

```typescript
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  // ... treestruct output that displays the ask
  console.error('   └─ consider: does this impact your goals?');
  console.error('      ├─ if yes, triage before you proceed');
  console.error('      └─ run `rhx goal.triage.infer`');
};
```

matches the format specified in the wish (lines 43-57).

**verdict**: ✓ covered

### 4. exits 0 (does not halt brain)

**location**: `src/contract/cli/goal.ts:1007`

```typescript
process.exit(0);
```

the hook.onTalk branch always exits 0 after the reminder is emitted.

**verdict**: ✓ covered

### 5. extant `hook.onStop` behavior unchanged

**location**: `src/contract/cli/goal.ts:1013-1080`

the hook.onStop branch remains intact:
- checks for uncovered asks and incomplete goals
- halts (exit 2) if issues found
- silent exit 0 if all clear

**verdict**: ✓ covered (unchanged)

## additional requirements from wish

### mode acceptance

**wish**: "accept `'hook.onTalk'` as a valid mode"

**location**: `src/contract/cli/goal.ts:440`

```typescript
mode: 'triage' | 'hook.onStop' | 'hook.onTalk';
```

**verdict**: ✓ covered

### stdin JSON format

**wish**: "read the user's message from stdin (claude code pipes it)"

**location**: `src/contract/cli/goal.ts:497-508`

```typescript
export const parseStdinPrompt = (raw: string): string | null => {
  // ... parses JSON and extracts prompt field
};
```

handles Claude Code's `{"prompt": "user message"}` format.

**verdict**: ✓ covered

## conclusion

all acceptance criteria from the wish are covered:

| criterion | status |
|-----------|--------|
| reads stdin and calls setAsk | ✓ |
| appends to asks.inventory.jsonl | ✓ |
| short reminder output | ✓ |
| exits 0 | ✓ |
| hook.onStop unchanged | ✓ |

no gaps found.
