# self-review: behavior-declaration-adherance (r6)

## review scope

execution stone 5.1 — achiever-finishall implementation

line-by-line verification that implementation matches vision, criteria, and blueprint.

## file-by-file review

### 1. goal.guard.sh (shell entrypoint)

**blueprint spec:**
```
[+] goal.guard.sh
    └─ exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalGuard())"
```

**implementation (lines 1-21):**
```bash
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalGuard())" -- "$@"
```

**verification:**
- ✓ shebang matches extant pattern
- ✓ fail-fast with `set -euo pipefail`
- ✓ exec node invocation matches blueprint exactly
- ✓ passes args with `-- "$@"`

### 2. goal.triage.next.sh (shell entrypoint)

**blueprint spec:**
```
[+] goal.triage.next.sh
    └─ exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageNext())"
```

**implementation (lines 1-22):**
```bash
#!/usr/bin/env bash
set -euo pipefail
exec node -e "import('rhachet-roles-bhrain/cli/goal').then(m => m.goalTriageNext())" -- "$@"
```

**verification:**
- ✓ shebang matches extant pattern
- ✓ fail-fast with `set -euo pipefail`
- ✓ exec node invocation matches blueprint exactly
- ✓ passes args with `-- "$@"`

### 3. getGoalGuardVerdict.ts (path evaluation)

**blueprint spec:**
```
[+] getGoalGuardVerdict
    ├─ extract path from tool_input (file_path or command)
    ├─ match against ^\.goals/ and /\.goals/ patterns
    ├─ return { verdict: 'allowed' | 'blocked', reason?: string }
```

**implementation (lines 34, 55-82):**
```typescript
const GOALS_PATH_PATTERN = /(^|\/)\.goals(\/|$)/;

export const getGoalGuardVerdict = (input: {
  toolName: string;
  toolInput: { file_path?: string; command?: string };
}): GoalGuardVerdict => {
  // extract path to check
  if (input.toolName === 'Bash' && input.toolInput.command) {
    pathToCheck = extractPathFromCommand(input.toolInput.command);
  } else if (input.toolInput.file_path) {
    pathToCheck = input.toolInput.file_path;
  }
  // check against pattern
  if (GOALS_PATH_PATTERN.test(pathToCheck)) {
    return { verdict: 'blocked', reason: `direct access to .goals/ is forbidden: ${pathToCheck}` };
  }
  return { verdict: 'allowed' };
};
```

**verification:**
- ✓ extracts file_path for Read/Write/Edit
- ✓ extracts path from command for Bash
- ✓ regex `/(^|\/)\.goals(\/|$)/` matches blueprint patterns
- ✓ returns verdict object per blueprint
- ✓ pattern matches `.goals/`, `path/.goals/`, not `.goals-archive/`

### 4. goalGuard (CLI handler)

**vision spec (block output):**
```
🦉 patience, friend.

🔮 goal.guard
   ├─ ✋ blocked: direct access to .goals/ is forbidden
   │
   └─ use skills instead
      ├─ goal.memory.set — persist or update a goal
      ├─ goal.memory.get — retrieve goal state
      ├─ goal.infer.triage — detect uncovered asks
      └─ goal.triage.next — show unfinished goals
```

**implementation (lines 1036-1047):**
```typescript
console.error(OWL_WISDOM_GUARD);  // '🦉 patience, friend.'
console.error('');
console.error('🔮 goal.guard');
console.error('   ├─ ✋ blocked: direct access to .goals/ is forbidden');
console.error('   │');
console.error('   └─ use skills instead');
console.error('      ├─ goal.memory.set — persist or update a goal');
console.error('      ├─ goal.memory.get — retrieve goal state');
console.error('      ├─ goal.infer.triage — detect uncovered asks');
console.error('      └─ goal.triage.next — show unfinished goals');
process.exit(2);
```

**verification:**
- ✓ owl wisdom matches vision exactly: "patience, friend"
- ✓ crystal ball header: "🔮 goal.guard"
- ✓ blocked message matches vision
- ✓ skills list matches vision (4 skills, exact text)
- ✓ output to stderr (per rule.forbid.stdout-on-exit-errors)
- ✓ exit code 2 (per criteria)

### 5. goalTriageNext (CLI handler)

**vision spec (inflight output):**
```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.next --when hook.onStop
   ├─ scope = repo
   └─ inflight (2)
      ├─ (1)
      │  ├─ slug = fix-auth-test
      │  ├─ why.ask = ...
      │  └─ status = inflight → ✋ finish this first
```

**implementation (lines 1135-1156):**
```typescript
console.error(OWL_WISDOM);  // '🦉 to forget an ask is to break a promise. remember.'
console.error('');
console.error(`🔮 goal.triage.next --when hook.onStop`);
console.error(`   ├─ scope = ${scope}`);
console.error(`   └─ inflight (${inflightGoals.goals.length})`);
// for each goal:
console.error(`      ${branch} (${i + 1})`);
console.error(`      ${cont}├─ slug = ${goal.slug}`);
console.error(`      ${cont}├─ why.ask = ${askShort}`);
console.error(`      ${cont}└─ status = inflight → ✋ finish this first`);
process.exit(2);
```

**verification:**
- ✓ owl wisdom matches vision: "to forget an ask is to break a promise. remember."
- ✓ crystal ball header with args
- ✓ scope line matches vision
- ✓ inflight count in parentheses
- ✓ each goal shows slug, why.ask, status with ✋
- ✓ treestruct branches (├─, └─, │) correct
- ✓ output to stderr
- ✓ exit code 2

### 6. getAchieverRole.ts (hook registration)

**blueprint spec:**
```
[~] getAchieverRole.ts
    └─ hooks.onBrain
       ├─ [+] onTool: goal.guard (filter: Read|Write|Edit|Bash, when: before)
       └─ [~] onStop: add goal.triage.next --when hook.onStop
```

**implementation (lines 22-47):**
```typescript
hooks: {
  onBrain: {
    onTool: [{
      command: './node_modules/.bin/rhx goal.guard',
      timeout: 'PT5S',
      filter: { what: 'Read|Write|Edit|Bash', when: 'before' },
    }],
    onStop: [
      { command: './node_modules/.bin/rhx goal.infer.triage --mode hook.onStop', ... },
      { command: './node_modules/.bin/rhx goal.triage.next --when hook.onStop', ... },
    ],
  },
},
```

**verification:**
- ✓ onTool hook registered for goal.guard
- ✓ filter matches blueprint: Read|Write|Edit|Bash, when: before
- ✓ onStop includes goal.triage.next with --when hook.onStop
- ✓ onStop includes extant goal.infer.triage (preserved)
- ✓ timeout values reasonable (PT5S, PT10S)

## criteria adherance

| criterion | vision | criteria | implementation |
|-----------|--------|----------|----------------|
| blocked exit code | exit 2 | exit 2 | ✓ process.exit(2) |
| unfinished exit code | exit 2 | exit 2 | ✓ process.exit(2) |
| allowed exit code | (silent) | exit 0 | ✓ implicit return |
| no goals exit code | (silent) | exit 0 | ✓ implicit return |
| inflight priority | show inflight only | show inflight only | ✓ if block at 1141 |
| enqueued fallback | show if no inflight | show if no inflight | ✓ if block at 1160 |
| output destination | stderr | stderr | ✓ console.error |

## gaps found

none. every file matches the vision, criteria, and blueprint specifications.

## why it holds

1. **shell scripts** follow extant pattern (shebang, fail-fast, exec node)
2. **domain operation** implements exact regex from blueprint with clear documentation
3. **CLI handlers** output character-for-character match of vision spec
4. **hook registration** uses correct filter and adds both new hooks
5. **exit codes** follow criteria precisely
6. **output format** uses treestruct with owl wisdom per vision

the implementation is a faithful execution of the behavior declaration.
