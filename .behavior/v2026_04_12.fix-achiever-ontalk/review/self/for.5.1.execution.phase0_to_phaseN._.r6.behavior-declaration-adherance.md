# review: behavior-declaration-adherance (r6)

## the question

does the implementation match the behavior declaration correctly?

## deeper investigation

re-read the wish line by line. cross-referenced each statement with code.

### wish line 12: accumulate the ask with content hash

**wish text**: "accumulate the ask to `.goals/$branch/asks.inventory.jsonl` (with content hash)"

**code path**:
1. `hook.onTalk` branch calls `setAsk({ content: prompt, scopeDir })`
2. `setAsk` at `src/domain.operations/goal/setAsk.ts` computes hash
3. hash computed via `toHashSha256Sync(content)`
4. appended to `${scopeDir}/asks.inventory.jsonl`

**verified in code**:
```typescript
// goal.ts:1005
await setAsk({ content: prompt, scopeDir });
```

```typescript
// setAsk.ts (read earlier in session)
const hash = toHashSha256Sync(content);
// ... appends { content, hash, ... } to asks.inventory.jsonl
```

**verdict**: ✓ adherent — ask accumulated with hash

### wish line 13: emit short reminder

**wish text**: "emit a short reminder: 'consider if this impacts your goals'"

**implementation**: `emitOnTalkReminder` outputs to stderr

the "consider" line:
```typescript
console.error('   └─ consider: does this impact your goals?');
```

**verdict**: ✓ adherent — reminder includes "consider" and "goals"

### wish line 14: NOT halt the brain

**wish text**: "NOT halt the brain"

**implementation**:
```typescript
process.exit(0);  // exit code 0 = hook passes
```

Claude Code hooks:
- exit 0 = continue (brain proceeds)
- exit non-zero = halt (brain stops)

**verdict**: ✓ adherent — exit 0 never halts

### wish lines 27-29: accept hook.onTalk mode

**wish text**: "currently `parseArgsForTriage` only recognizes `'triage' | 'hook.onStop'`. need to: accept `'hook.onTalk'` as a valid mode"

**implementation**:
```typescript
mode: 'triage' | 'hook.onStop' | 'hook.onTalk'
```

**verdict**: ✓ adherent — type union extended

### wish lines 33-37: when mode is hook.onTalk

**wish checklist**:
- [x] read the user's message from stdin → `extractPromptFromStdin()`
- [x] call `setAsk({ content, scopeDir })` → done
- [x] emit a short reminder to stderr → `emitOnTalkReminder(prompt)`
- [x] exit 0 (never halt) → `process.exit(0)`

**verdict**: ✓ adherent — all four steps present

### wish lines 43-57: reminder format

**wish format**:
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

**implementation in emitOnTalkReminder**:

line-by-line comparison:
| wish line | implementation | match? |
|-----------|---------------|--------|
| 🦉 to forget... | `console.error(OWL_WISDOM)` | ✓ |
| blank line | `console.error('')` | ✓ |
| 🔮 goal.triage.infer... | exact match | ✓ |
| ├─ from = peer:human | exact match | ✓ |
| ├─ ask | exact match | ✓ |
| │ ├─ | exact match | ✓ |
| │ │ {message} | loops through lines | ✓ |
| │ └─ | exact match | ✓ |
| └─ consider... | exact match | ✓ |
| ├─ if yes... | exact match | ✓ |
| └─ run... | exact match | ✓ |

**verdict**: ✓ adherent — format matches

### wish lines 62-65: stdin read and parse

**wish text**:
- read stdin to get the message content
- compute hash via `setAsk`
- append to `asks.inventory.jsonl`

**implementation**:
1. `extractPromptFromStdin()` → reads stdin, parses JSON, extracts prompt
2. `setAsk({ content, scopeDir })` → computes hash, appends to jsonl

**verdict**: ✓ adherent — full pipeline implemented

### wish line 88: hook.onStop unchanged

**wish text**: "extant `hook.onStop` behavior unchanged"

**verification**: compared hook.onStop branch before/after

the branch at lines 1013-1080 is identical to prior implementation:
- checks `asksUncovered` and `goalsIncomplete`
- halts if either has items
- silent exit 0 otherwise

**verdict**: ✓ adherent — no changes to hook.onStop

## conclusion

every requirement from the wish has been implemented correctly:

| requirement | wish line | adherent |
|-------------|-----------|----------|
| accumulate with hash | 12 | ✓ |
| short reminder | 13 | ✓ |
| not halt | 14 | ✓ |
| accept hook.onTalk | 27-29 | ✓ |
| when mode is hook.onTalk | 33-37 | ✓ |
| reminder format | 43-57 | ✓ |
| stdin read and parse | 62-65 | ✓ |
| hook.onStop unchanged | 88 | ✓ |

no deviations from the specification.
