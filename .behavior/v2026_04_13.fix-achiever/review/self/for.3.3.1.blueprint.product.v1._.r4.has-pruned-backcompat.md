# self-review r4: has-pruned-backcompat

## what i found

i re-examined the extant code (`src/contract/cli/goal.ts`) and identified INTENTIONAL BREAKING CHANGES that the blueprint introduces. these are requested by the wish, not backwards compat concerns to prune.

---

## breaking changes identified

### breaking change 1: unknown flags now fail-fast

**current behavior (lines 332-371):**
```ts
for (let i = 0; i < args.length; i++) {
  const arg = args[i] as string;
  // only known flags processed, unknown silently ignored
}
```

unknown flags like `--foo bar` are silently ignored. the invocation succeeds with partial state.

**new behavior:** fail-fast with error that lists allowed flags.

**is this intentional?** yes. wish 6: "forbid unknown args on the rhx goal.memory.set operation... unknown keys -> failfast"

**verdict:** intentional breaking change per wish 6. not backwards compat to preserve.

---

### breaking change 2: invalid status values now fail-fast

**current behavior (line 357):**
```ts
status = nextArg as GoalStatusChoice;
```

any string is accepted. invalid values like `--status garbage` are cast without validation.

**new behavior:** fail-fast with error that lists valid status values.

**is this intentional?** yes. the spirit of wish 6 is "fail-fast on invalid input." an invalid status is invalid input. the vision doc explicitly says "validate status enum."

**verdict:** intentional breaking change per wish 6 spirit. not backwards compat to preserve.

---

### breaking change 3: --scope repo while bound now fails

**current behavior:** `--scope repo` accepted even when bound to route. writes goals to wrong location.

**new behavior:** fail-fast with error that explains scope is automatic.

**is this intentional?** yes. wish 2: "discourage use of --scope repo. scope should be automatic." vision says "fail-fast if --scope repo while bound to route."

**verdict:** intentional breaking change per wish 2 and vision. not backwards compat to preserve.

---

## NOT breaking: changes that preserve extant valid usage

### stdin yaml still accepted

**current behavior:** stdin yaml is valid input mode.

**new behavior:** still accepted, but flags one-by-one is recommended in help.

**verdict:** not breaking. valid input mode preserved. guidance changed.

---

### --scope flag still works when unbound

**current behavior:** `--scope repo` works when not bound to route.

**new behavior:** still works when not bound.

**verdict:** not breaking. escape hatch preserved for valid use.

---

### extant goal yaml files unchanged

**current behavior:** goals stored as yaml with slug, why, what, how, status, source.

**new behavior:** same format. new `.blockers.latest.json` is additive.

**verdict:** not breaking. extant goals remain readable.

---

## summary: backwards compat pruned vs intentional breaks

| change | type | per wish? |
|--------|------|-----------|
| unknown flags fail-fast | intentional break | yes (wish 6) |
| invalid status fail-fast | intentional break | yes (wish 6) |
| --scope repo while bound fails | intentional break | yes (wish 2) |
| stdin yaml still works | preserved | yes (wish 7 recommends flags, doesn't forbid stdin) |
| --scope unbound still works | preserved | yes (wish says "automatic", not "forbidden") |
| goal yaml format | preserved | not discussed (no need to break) |

**conclusion:** the blueprint introduces 3 intentional breaking changes explicitly requested by the wish. these should NOT be pruned as backwards compat concerns — they ARE the wish.

0 unnecessary backwards compat preserved "to be safe." all preserved behaviors serve valid use cases.
