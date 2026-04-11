# self-review: role-standards-adherance (r7)

## review scope

execution stone 5.1 — achiever-finishall implementation

line-by-line verification against mechanic role standards.

## briefs directories checked

```
.agent/repo=ehmpathy/role=mechanic/briefs/practices/
├── code.prod/
│   ├── evolvable.procedures/
│   │   ├── rule.require.input-context-pattern
│   │   ├── rule.require.arrow-only
│   │   └── rule.require.named-args
│   ├── evolvable.domain.operations/
│   │   ├── rule.require.get-set-gen-verbs
│   │   └── rule.require.sync-filename-opname
│   ├── pitofsuccess.errors/
│   │   ├── rule.require.exit-code-semantics
│   │   ├── rule.require.fail-fast
│   │   └── rule.forbid.stdout-on-exit-errors
│   ├── readable.comments/
│   │   └── rule.require.what-why-headers
│   └── readable.narrative/
│       └── rule.forbid.else-branches
├── code.test/
│   └── frames.behavior/
│       ├── rule.require.given-when-then
│       └── rule.require.useThen
└── lang.terms/
    └── rule.forbid.gerunds
```

## issue found and fixed

### issue: else-if branch in getGoalGuardVerdict.ts

**rule violated:** rule.forbid.else-branches
- rule text: "never use elses or if elses"
- rule location: `.agent/repo=ehmpathy/role=mechanic/briefs/practices/code.prod/readable.narrative/rule.forbid.else-branches.md.min`

**before (line 64):**
```typescript
if (input.toolName === 'Bash' && input.toolInput.command) {
  pathToCheck = extractPathFromCommand(input.toolInput.command);
} else if (input.toolInput.file_path) {  // 👎 forbidden
  pathToCheck = input.toolInput.file_path;
}
```

**after (refactored to helper with early returns):**
```typescript
const extractPathToCheck = (input: { ... }): string | null => {
  if (input.toolName === 'Bash' && input.toolInput.command) {
    return extractPathFromCommand(input.toolInput.command);
  }
  if (input.toolInput.file_path) {
    return input.toolInput.file_path;
  }
  return null;
};

export const getGoalGuardVerdict = (input: { ... }): GoalGuardVerdict => {
  const pathToCheck = extractPathToCheck(input);  // now const, not let
  // ...
};
```

**why the fix works:**
1. else-if replaced with sequential if + early return
2. `let pathToCheck` became `const pathToCheck`
3. new helper has .what/.why header
4. all 14 unit tests still pass

---

## file-by-file verification

### src/domain.operations/goal/getGoalGuardVerdict.ts

**rule.require.what-why-headers:**
```typescript
// lines 1-4
/**
 * .what = evaluate whether a tool invocation should be blocked for direct .goals/ access
 * .why = prevents bots from bypass of goal accountability via direct file manipulation
 */
```
✓ file-level header present

```typescript
// lines 51-54 (new helper after fix)
/**
 * .what = extract path to check from tool input
 * .why = separates path extraction logic for clarity
 */
const extractPathToCheck = ...
```
✓ helper has header

**rule.require.arrow-only:**
- `const extractPathFromCommand = (command: string): string | null =>` (line 58)
- `const extractPathToCheck = (input: {...}): string | null =>` (line 55)
- `const getGoalGuardVerdict = (input: {...}): GoalGuardVerdict =>` (line 71)
✓ all functions use arrow syntax

**rule.require.input-context-pattern:**
```typescript
export const getGoalGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): GoalGuardVerdict =>
```
✓ uses `(input: {...})` pattern

**rule.require.get-set-gen-verbs:**
- function name: `getGoalGuardVerdict`
- verb: `get`
✓ uses get verb per convention

**rule.forbid.else-branches:**
✓ no else or else-if after fix

---

### src/contract/cli/goal.ts — goalGuard (lines 1002-1048)

**rule.require.what-why-headers:**
```typescript
// lines 994-1001
/**
 * .what = cli entrypoint for goal.guard PreToolUse hook
 * .why = blocks direct access to .goals/ to enforce skill usage
 *
 * reads tool invocation JSON from stdin (from claude code harness)
 * exits 0 if allowed (silent)
 * exits 2 if blocked (stderr output)
 */
```
✓ full header with .what, .why, and behavior docs

**rule.require.exit-code-semantics:**
- exit 2 for blocked = constraint (user must use skills instead)
- exit 0 for allowed = success (implicit return)

rule says:
> exit 2 = constraint: user must fix something

goalGuard semantics match: blocked means user must change approach to use skills.
✓ exit codes correct

**rule.forbid.stdout-on-exit-errors:**
```typescript
// lines 1036-1045
console.error(OWL_WISDOM_GUARD);
console.error('');
console.error('🔮 goal.guard');
// ... all output via console.error
process.exit(2);
```
✓ all output to stderr when exit 2

**rule.require.fail-fast:**
- line 1012: early return if no stdin
- line 1024: early return if malformed JSON
- line 1032: early return if allowed
✓ uses early returns

---

### src/contract/cli/goal.ts — goalTriageNext (lines 1106-1177)

**rule.require.what-why-headers:**
```typescript
// lines 1098-1105
/**
 * .what = cli entrypoint for goal.triage.next skill
 * .why = onStop hook that shows unfinished goals to mandate continuation
 *
 * shows inflight goals if any exist (priority)
 * shows enqueued goals if no inflight
 * silent exit if no unfinished goals
 */
```
✓ full header

**rule.require.exit-code-semantics:**
- exit 2 for unfinished goals = constraint (user must complete work)
- exit 0 for no unfinished = success

rule says:
> exit 2 = constraint: user must fix something

goalTriageNext semantics match: unfinished goals means user has work to do.
✓ exit codes correct

**rule.forbid.stdout-on-exit-errors:**
```typescript
// lines 1135-1156
console.error(OWL_WISDOM);
console.error('');
// ... all output via console.error
process.exit(2);
```
✓ all output to stderr when exit 2

**rule.forbid.else-branches:**
```typescript
// inflight priority
if (inflightGoals.goals.length > 0) {
  // ... show and exit 2
}
// enqueued fallback (no else, just next if)
if (enqueuedGoals.goals.length > 0) {
  // ... show and exit 2
}
```
✓ no else branches, uses sequential if + early exit

---

### src/domain.roles/achiever/skills/goal.guard.sh

**rule.require.what-why-headers:**
```bash
# lines 1-17
# .what = PreToolUse hook to protect .goals/ from direct manipulation
#
# .why = prevents bots from bypass of goal accountability:
#        - no rm, mv, cat via Bash
#        - no Read, Write, Edit on .goals/ paths
```
✓ header present

**fail-fast:**
```bash
set -euo pipefail
```
✓ shell fail-fast

---

### blackbox/achiever.goal.guard.acceptance.test.ts

**rule.require.given-when-then:**
```typescript
import { given, then, useThen, when } from 'test-fns';
```
✓ imports BDD helpers

**rule.require.useThen:**
```typescript
const result = useThen('invoke goal.guard', async () => {
  return invokeGoalGuard({ ... });
});
```
✓ uses useThen for shared results

**howto.write-bdd labels:**
```typescript
given('[case1] Read tool with .goals/ path', () => {
  when('[t0] path is .goals/branch/file.yaml', () => {
```
✓ uses [caseN] and [tN] labels

---

### blackbox/.test/invokeGoalSkill.ts — utilities

**rule.require.what-why-headers:**
```typescript
// lines 135-138
/**
 * .what = invokes goal.guard with tool input as stdin
 * .why = enables acceptance tests for PreToolUse hook
 */
export const invokeGoalGuard = async (...) => { ... }

// lines 156-159
/**
 * .what = invokes goal.triage.next with args
 * .why = enables acceptance tests for onStop hook
 */
export const invokeGoalTriageNext = async (...) => { ... }
```
✓ utilities have headers

---

## why it holds (after fix)

| standard | status | evidence |
|----------|--------|----------|
| rule.forbid.else-branches | ✓ fixed | extracted helper with early returns |
| rule.require.immutable-vars | ✓ fixed | pathToCheck now const |
| rule.require.what-why-headers | ✓ | all procedures documented |
| rule.require.arrow-only | ✓ | no function keyword |
| rule.require.input-context-pattern | ✓ | `(input: {...})` |
| rule.require.exit-code-semantics | ✓ | 0=success, 2=constraint |
| rule.forbid.stdout-on-exit-errors | ✓ | stderr for exit 2 |
| rule.require.fail-fast | ✓ | early returns |
| rule.require.get-set-gen-verbs | ✓ | uses `get` |
| rule.require.given-when-then | ✓ | test-fns BDD |
| rule.require.useThen | ✓ | shared async results |
| rule.forbid.gerunds | ✓ | no -ing nouns |

all mechanic role standards satisfied after the else-if fix.
