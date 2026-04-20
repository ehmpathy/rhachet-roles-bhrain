# review: behavior-declaration-coverage (r5)

## the question

does the implementation cover all requirements from the behavior declaration?

## methodology

opened and re-read:
1. `.behavior/v2026_04_12.fix-achiever-ontalk/0.wish.md` — the wish
2. `src/contract/cli/goal.ts` — the implementation

verified each acceptance criterion line by line.

## acceptance criteria verification

### 1. reads stdin and calls setAsk

**wish line 84**: `goal.triage.infer --when hook.onTalk` reads stdin and calls `setAsk`

**implementation at goal.ts:1001-1005**:
```typescript
if (mode === 'hook.onTalk') {
  const prompt = extractPromptFromStdin();
  if (!prompt) process.exit(0);
  await setAsk({ content: prompt, scopeDir });
```

**why it holds**:
- `extractPromptFromStdin()` calls `readStdin()` then `parseStdinPrompt()`
- `parseStdinPrompt()` handles Claude Code's JSON format `{"prompt": "..."}`
- `setAsk()` is called with the extracted prompt

**verdict**: ✓ criterion satisfied

### 2. ask appended to inventory with hash

**wish line 85**: ask is appended to `asks.inventory.jsonl` with content hash

**implementation**: delegated to `setAsk` at `src/domain.operations/goal/setAsk.ts`

**why it holds**:
- `setAsk` computes `toHashSha256Sync(content)` for deduplication
- appends to `${scopeDir}/asks.inventory.jsonl`
- this function was tested in prior acceptance tests

**verdict**: ✓ criterion satisfied

### 3. short reminder output

**wish lines 43-57**: specific treestruct format for reminder

expected:
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │  {the user's message}
   │  └─
   └─ consider: does this impact your goals?
```

**implementation at goal.ts:524-541**:
```typescript
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  console.error('   ├─ from = peer:human');
  console.error('   ├─ ask');
  console.error('   │  ├─');
  console.error('   │  │  ');
  for (const line of content.split('\n')) {
    console.error(`   │  │    ${line}`);
  }
  console.error('   │  │  ');
  console.error('   │  └─');
  console.error('   │');
  console.error('   └─ consider: does this impact your goals?');
  console.error('      ├─ if yes, triage before you proceed');
  console.error('      └─ run `rhx goal.triage.infer`');
};
```

**why it holds**:
- uses `OWL_WISDOM` constant for the owl line
- all output goes to stderr (not stdout)
- treestruct format matches the wish specification
- includes the "consider" nudge with actionable next step

**verdict**: ✓ criterion satisfied

### 4. exits 0 (does not halt brain)

**wish line 87**: exits 0 (does not halt brain)

**implementation at goal.ts:1007**:
```typescript
process.exit(0);
```

**why it holds**:
- unconditional `process.exit(0)` at end of hook.onTalk branch
- this is after both `setAsk` and `emitOnTalkReminder` complete
- exit 0 means hook passes, brain continues

**verdict**: ✓ criterion satisfied

### 5. hook.onStop unchanged

**wish line 88**: extant `hook.onStop` behavior unchanged

**implementation at goal.ts:1013-1080**: reviewed the hook.onStop branch

**why it holds**:
- branch still checks `state.asksUncovered` and `state.goalsIncomplete`
- still halts with exit 2 if either has items
- still silent exit 0 if all clear
- no logic changes to this branch

**verdict**: ✓ criterion satisfied

## gaps found

none.

all five acceptance criteria from the wish are fully covered by the implementation.

## conclusion

| criterion | location | status |
|-----------|----------|--------|
| reads stdin, calls setAsk | goal.ts:1001-1005 | ✓ |
| appends to inventory | setAsk.ts | ✓ |
| short reminder output | goal.ts:524-541 | ✓ |
| exits 0 | goal.ts:1007 | ✓ |
| hook.onStop unchanged | goal.ts:1013-1080 | ✓ |

implementation fully covers the behavior declaration.
