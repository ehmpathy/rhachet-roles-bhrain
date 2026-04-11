# self-review: has-pruned-backcompat (r2)

## review scope

execution stone 5.1 — achiever-finishall implementation

deeper review of actual code for backwards compatibility patterns.

## code examined

### goalGuard CLI handler (goal.ts:1002-1033)

```typescript
// line 1010-1013: if no input, allow (edge case)
if (!stdinContent) {
  return;
}

// line 1022-1025: malformed JSON, allow (harness issue)
try {
  const parsed = JSON.parse(stdinContent);
} catch {
  return;
}
```

**is this backcompat?** no. this is defensive error tolerance for the current implementation — handles edge cases where harness sends malformed data. no "old format" supported here.

### goalTriageNext CLI handler (goal.ts:1106-1136)

```typescript
// line 1114-1117
try {
  scopeDir = await getScopeDir(scope);
} catch {
  return;
}
```

**is this backcompat?** no. this is graceful degradation when scope detection fails (e.g., branch not bound to route). no legacy scope format supported.

### getGoalGuardVerdict (getGoalGuardVerdict.ts)

single implementation path:
1. extract path from tool input
2. check against regex pattern
3. return verdict

**backcompat code?** none. the regex `/(^|\/)\.goals(\/|$)/` is the only pattern. no fallback patterns for "old" path formats.

### getAchieverRole.ts hooks

```typescript
hooks: {
  onBrain: {
    onTool: [{ command: './node_modules/.bin/rhx goal.guard', ... }],
    onStop: [
      { command: './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop', ... },
      { command: './node_modules/.bin/rhx goal.triage.next --when hook.onStop', ... },
    ],
  },
},
```

**backcompat code?** none. these are new hooks. no "if old version, do X" logic.

## backwards compatibility code found

none.

## why it holds

this feature is purely additive. the implementation does not:
- maintain old API signatures
- support deprecated formats
- include "just in case" fallbacks for prior versions
- have conditional logic based on version detection

the error tolerance code (try/catch blocks) handles current implementation edge cases, not legacy compatibility.
