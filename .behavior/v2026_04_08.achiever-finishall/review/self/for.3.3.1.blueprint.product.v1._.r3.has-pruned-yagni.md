# self-review: has-pruned-yagni

## question: did I add extras that were not prescribed?

### component-by-component YAGNI review

| component | requested? | minimum viable? | added "for future"? | verdict |
|-----------|------------|-----------------|---------------------|---------|
| goal.triage.next.sh | yes — wish | yes | no | keep |
| goal.guard.sh | yes — wish | yes | no | keep |
| goalTriageNext (cli) | yes — needed for shell skill | yes | no | keep |
| goalGuard (cli) | yes — needed for shell skill | yes | no | keep |
| ~~getTriageState~~ | no — not in wish | no — wrapper only | yes — "testable in isolation" | **deleted** |
| getGoalGuardVerdict | yes — regex logic | yes — actual computation | no | keep |

### why each component is necessary

**goal.triage.next.sh**: the wish explicitly requests `goal.triage.next --when hook.onStop`. a shell entrypoint is the minimum way to satisfy this.

**goal.guard.sh**: the wish explicitly requests "hook to forbid touch .goals/ dirs". a shell entrypoint enables hook registration.

**goalTriageNext (cli)**: shell skills invoke node via `import('pkg/cli/goal').then(m => m.goalTriageNext())`. this is the repo pattern. no alternative.

**goalGuard (cli)**: same pattern as above. PreToolUse hooks read stdin JSON and output to stderr.

**getGoalGuardVerdict**: the regex `(^|/)\.goals(/|$)` handles 4 distinct cases:
1. `^\.goals/` — root-scope goals
2. `^\.goals$` — root-scope without end slash
3. `/\.goals/` — route-scope goals
4. `/\.goals$` — route-scope without end slash

this logic also extracts paths from two different tool input shapes (`file_path` vs `command`). encapsulation is justified by complexity.

### did I add getTriageState "for future flexibility"?

**the question:** is getTriageState YAGNI?

**what it does:**
```typescript
getTriageState({ scope }) => { inflight: Goal[], enqueued: Goal[] }
```

**could goalTriageNext call getGoals directly?**
yes:
```typescript
const inflight = await getGoals({ scope, status: ['inflight'] });
const enqueued = await getGoals({ scope, status: ['enqueued'] });
```

**why did I add it?**
- separation of "what to show" from "how to format"
- testable in isolation

**is this "for future flexibility"?** yes, arguably. the cli could do both calls inline.

**verdict:** **YAGNI violation found and fixed.** deleted getTriageState from blueprint. goalTriageNext now calls getGoals directly.

---

### did I add abstractions "while we're here"?

**snapshot utilities:**
- sanitizeGoalOutputForSnapshot — already exists, reuse
- no new utilities added

**output formatters:**
- treestruct output — inline in cli, no separate formatter
- no abstraction added

**verdict:** no unnecessary abstractions.

---

### did I optimize before needed?

**path match logic:**
- getGoalGuardVerdict encapsulates regex
- is this premature? no — the regex logic is non-trivial (handle both root and route scope)
- encapsulation makes it testable

**exit code logic:**
- no special abstraction
- inline constants

**verdict:** no premature optimization.

---

### did I add features "while we're here"?

**scope inference:**
- already exists in getDefaultScope
- reuse, not addition

**privilege flag:**
- not added (unlike route.mutate.guard which has privilege)
- could have added "while we're here" but didn't

**verbose mode:**
- not added
- could have added `--verbose` flag but didn't

**verdict:** no feature creep.

---

## conclusion

**YAGNI violation found and fixed:** 1

### the issue: getTriageState

**what was wrong:** getTriageState wrapped two getGoals calls into a separate operation. this added a file and an indirection for no immediate benefit.

**how it was fixed:** removed getTriageState from the blueprint filediff tree and codepath tree. goalTriageNext now calls getGoals directly:
```typescript
const inflight = await getGoals({ scope, status: ['inflight'] });
const enqueued = await getGoals({ scope, status: ['enqueued'] });
```

**what I learned:** the temptation to separate "what to fetch" from "how to format" is strong but often premature. wait until there are 3+ callers before extraction. in this case, there is exactly one caller (goalTriageNext), so inline is correct.

### components that pass YAGNI

| component | why it holds |
|-----------|--------------|
| goal.triage.next.sh | minimum shell entrypoint, no extras |
| goal.guard.sh | minimum shell entrypoint, no extras |
| goalTriageNext | direct getGoals calls, no wrapper |
| goalGuard | direct verdict call, no extras |
| getGoalGuardVerdict | regex is non-trivial, encapsulation justified |

**why getGoalGuardVerdict is not YAGNI:**
- the regex pattern `(^|/)\.goals(/|$)` handles multiple cases
- the logic extracts paths from different tool inputs (file_path vs command)
- testable in isolation means we can verify edge cases without full cli invocation
- unlike getTriageState, this operation does actual computation, not just delegation

