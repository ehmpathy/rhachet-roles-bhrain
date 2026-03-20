# self-review r9: has-role-standards-adherance

## pause

i am the reviewer, not the author.

i enumerate the mechanic role briefs relevant to this blueprint, then check each section of the blueprint for adherance. i look for violations, anti-patterns, or deviations from required patterns.

---

## rule directories to check

the mechanic role has briefs in these categories. i mark which are relevant to this blueprint:

| category | relevant? | why |
|----------|-----------|-----|
| `code.prod/consistent.artifacts` | no | no new packages |
| `code.prod/consistent.contracts` | no | no contract changes |
| `code.prod/evolvable.architecture` | yes | boundary checks |
| `code.prod/evolvable.procedures` | yes | input/context pattern |
| `code.prod/pitofsuccess.errors` | no | no new error handling |
| `code.prod/pitofsuccess.typedefs` | no | no type changes |
| `code.prod/readable.comments` | yes | code changes need comments |
| `code.prod/readable.narrative` | yes | guard flow |
| `code.test/frames.behavior` | yes | test structure |
| `lang.terms` | yes | naming, gerunds |

**relevant categories**:
1. `evolvable.architecture` — check bounded contexts
2. `evolvable.procedures` — check input/context pattern
3. `readable.comments` — check what/why headers
4. `readable.narrative` — check early returns, no else
5. `frames.behavior` — check given/when/then BDD
6. `lang.terms` — check gerunds, naming

**not relevant**:
- `consistent.artifacts` — no packages added
- `consistent.contracts` — no sdk/api changes
- `pitofsuccess.errors` — no new error handling
- `pitofsuccess.typedefs` — no new types

---

## blueprint line-by-line review

### section: summary (lines 5-8)

```
fix the route.mutate guard to:
1. allow artifact writes to the bound route directory itself
2. block writes to the `.route/` metadata subdirectory within the route
3. move blocker articulation files from `$route/.route/blocker/` to `$route/blocker/`
```

**check for standards**:
- "fix" — verb, not gerund ✓
- "allow artifact writes" — "writes" is noun here (things written), not gerund ✓
- "block writes" — same pattern ✓
- "move blocker articulation files" — verb "move" ✓
- no forbidden terms detected ✓

**why it holds**: summary uses precise verbs and domain nouns. no vague terminology.

---

### section: filediff tree (lines 14-29)

```
src/
├─ domain.roles/driver/skills/
│  ├─ [~] route.mutate.guard.sh
│  └─ [~] route.mutate.guard.integration.test.ts
```

**check for standards**:
- `domain.roles/` — bounded context correct (driver role) ✓
- `domain.operations/route/blocked/` — bounded context correct (route operations) ✓
- file names sync with operations: `getBlockedChallengeDecision.ts` matches operation ✓
- test files follow convention: `*.integration.test.ts`, `*.test.ts`, `*.acceptance.test.ts` ✓

**why it holds**: files live in correct bounded contexts. no cross-boundary violations.

---

### section: codepath tree (lines 37-49)

```
guard hook invocation
├─ [○] parse stdin JSON
├─ [○] find bound route
├─ [○] check privilege
└─ [~] evaluate protection
```

**check for standards**:
- codepath uses early exit pattern: "exit 0 if privilege flag present" ✓
- no else branches in codepath description ✓
- uses clear markers: [○] unchanged, [~] modified ✓

**why it holds**: codepath follows narrative flow pattern — early exits, no else.

---

### section: code snippets (lines 52-68)

```bash
# before:
elif echo "$FILE_PATH" | grep -qE "\.route/"; then

# after:
elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then
```

**check for standards**:
- uses extant shell variable `$ROUTE_DIR` ✓
- uses extant pattern `grep -qE` ✓
- uses `elif` (shell doesn't have early return, elif is acceptable) ✓
- no new variables introduced ✓

**why it holds**: shell code follows extant patterns. no new mechanisms.

---

### section: typescript changes (lines 70-86)

```
blocker path computation
└─ [~] compute articulationPath
   ├─ before: path.join(input.route, '.route', 'blocker', `${input.stone}.md`)
   └─ after: path.join(input.route, 'blocker', `${input.stone}.md`)
```

**check for standards**:
- uses `path.join()` standard utility ✓
- accesses input via `input.route`, `input.stone` (input/context pattern) ✓
- variable name `articulationPath` — noun, not gerund ✓

**why it holds**: typescript changes use standard patterns. input/context preserved.

---

## blueprint adherance check

### check 1: file name conventions

**standard**: `rule.require.sync-filename-opname`

the blueprint modifies these files:
- `route.mutate.guard.sh` — shell guard skill
- `route.mutate.guard.integration.test.ts` — test file
- `getBlockedChallengeDecision.ts` — operation file
- `stepRouteDrive.ts` — operation file

**why it holds**:
- `route.mutate.guard.sh` — shell skills use dot-separated names, no operation export
- `getBlockedChallengeDecision.ts` — filename matches operation name
- `stepRouteDrive.ts` — filename matches operation name
- test files follow `*.integration.test.ts` pattern

**adherance**: yes — file names follow conventions

---

### check 2: operation naming

**standard**: `rule.require.get-set-gen-verbs`

the blueprint modifies:
- `getBlockedChallengeDecision` — uses `get*` prefix
- `stepRouteDrive` — uses `step*` prefix

**why it holds**:
- `get*` operations retrieve or compute without mutation
- `step*` operations are allowed for driver workflows (not domain operations)
- the blueprint does not introduce new operations, only modifies paths in extant operations

**adherance**: yes — operation names follow verb conventions

---

### check 3: test structure

**standard**: `rule.require.given-when-then`, `howto.write-bdd.[lesson]`

the blueprint test coverage section (lines 92-132) shows:

**integration tests**:
```
given('[case N] bound route at .route/xyz/')
  when('[t0] Write to .route/xyz/artifact.md')
    then('exits with code 0 (allowed)')
  when('[t1] Write to .route/xyz/subdir/doc.md')
    then('exits with code 0 (allowed)')
  when('[t2] Write to .route/xyz/.route/passage.jsonl')
    then('exits with code 2 (blocked)')
```

**check against BDD standards**:
- `given('[case N]` — uses `[caseN]` label ✓
- `when('[t0]` through `when('[t2]` — uses sequential `[tN]` labels ✓
- `then('exits with code 0 (allowed)')` — assertion describes outcome ✓
- multiple `when` blocks under single `given` — groups related scenarios ✓

**acceptance tests**:
```
given('[case N] bound route at .route/xyz/ (not .behavior/)')
  when('[t0] guard allows artifact write')
  when('[t1] guard blocks metadata write')
```

**check against BDD standards**:
- follows same `[caseN]`/`[tN]` pattern ✓
- `when` blocks describe state after action ✓

**unit tests**:
```
before: expect(result.articulationPath).toContain('.route/blocker/3.blueprint.md')
after:  expect(result.articulationPath).toContain('blocker/3.blueprint.md')
```

**check**: update to extant assertion, not new test structure.

**why it holds**: all test changes follow BDD conventions from test-fns. given/when/then structure with proper labels.

**adherance**: yes — tests follow BDD structure

---

### check 4: path construction

**standard**: `rule.require.dependency-injection` (uses node `path.join`)

the blueprint codepath changes show:
```
before: path.join(input.route, '.route', 'blocker', `${input.stone}.md`)
after: path.join(input.route, 'blocker', `${input.stone}.md`)
```

**why it holds**:
- uses standard node `path.join()` for path construction
- does not introduce new utilities
- follows extant pattern in codebase (verified in r5 review)

**adherance**: yes — uses standard path construction

---

### check 5: shell pattern

the blueprint changes shell code:
```bash
# before:
elif echo "$FILE_PATH" | grep -qE "\.route/"; then

# after:
elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then
```

**why it holds**:
- modifies extant grep pattern, does not introduce new mechanism
- uses same `grep -qE` pattern as rest of file (consistency)
- uses extant `$ROUTE_DIR` variable (no new variables)

**adherance**: yes — shell changes follow extant patterns

---

### check 6: no gerunds

**standard**: `rule.forbid.gerunds`

review of blueprint text:
- "allow artifact writes" — uses noun "writes" not gerund ✓
- "block writes" — noun ✓
- "move blocker articulation files" — verb "move" ✓
- "change blocker path" — verb "change" ✓

**why it holds**: the blueprint uses verbs and nouns, not gerunds as nouns. all -ing forms in the blueprint are participles in verb phrases, not gerund nouns.

**adherance**: yes — no gerund violations

---

### check 7: naming order

**standard**: `rule.require.order.noun_adj`

the blueprint uses:
- `FILE_PATH` — noun only
- `ROUTE_DIR` — noun only
- `articulationPath` — noun only

**why it holds**: no [adjective][noun] naming detected. the blueprint does not introduce new variables or types — it only modifies extant code.

**adherance**: yes — follows noun-first naming

---

### check 8: no forbidden terms

**standard**: `rule.forbid.term-*` rules

review for forbidden terms in the blueprint text:

**checked terms**:
- uses "guard" for the shell skill (not the vague alternative)
- uses "pattern" for regex matching (precise)
- uses "path" for file locations (precise)
- uses "blocker" for articulation files (domain term)

**why it holds**: the blueprint text uses precise domain terms. no vague or overloaded terms detected.

**adherance**: yes — uses precise terminology

---

### check 9: backwards compatibility

**standard**: briefs emphasize non-breaking changes

the blueprint invariants state:
> "routes at `.behavior/` continue to work identically (backwards compatible)"

**why it holds**: the fix changes the pattern matching logic but preserves behavior for all extant routes. the pattern `^$ROUTE_DIR/\.route/` works identically for routes at `.behavior/` as for routes at `.route/`.

**adherance**: yes — backwards compatible by design

---

## gaps found

### none

the blueprint adheres to mechanic role standards:
1. file names follow conventions
2. operation names use correct verbs
3. tests use BDD structure
4. path construction uses standard utilities
5. shell changes follow extant patterns
6. no gerunds
7. no forbidden terms
8. backwards compatible

---

## conclusion

the blueprint follows mechanic role standards correctly:

| category | checked | adherance |
|----------|---------|-----------|
| file naming | yes | adheres |
| operation naming | yes | adheres |
| test structure | yes | adheres |
| path construction | yes | adheres |
| shell patterns | yes | adheres |
| gerunds | yes | none found |
| forbidden terms | yes | none found |
| backwards compat | yes | adheres |

no violations of required patterns detected.

