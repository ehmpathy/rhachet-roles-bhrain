# self-review: has-critical-paths-frictionless (r8)

## the question

are the critical paths frictionless in practice?

- for each critical path from repros, run through it manually — is it smooth?
- are there unexpected errors?
- does it feel effortless to the user?

## the review

### critical paths from repros

| critical path | description | why critical |
|---------------|-------------|--------------|
| triage on session end | brain is halted until all asks covered | core promise — no ask lost |
| goal creation with full schema | brain must articulate why/what/how | forced foresight is the differentiation |
| coverage verification | brain sees zero uncovered → may continue | proof that triage worked |

### verification of each path

#### path 1: triage on session end

**what happens:** hook.onStop fires, brain checks uncovered asks, halts if any exist.

**verification:** acceptance tests exercise this path. the `goal.infer.triage` skill returns uncovered asks and extant goals. the hook mode exits with code 2 if uncovered.

**output (from snapshots):**
```
goal.infer.triage
   asks: 2
   uncovered: 1
   goals: 1
```

**friction assessment:** none. output is minimal and clear. brain knows exactly what's uncovered.

#### path 2: goal creation with full schema

**what happens:** brain provides full YAML via stdin, goal is persisted with status flag.

**verification:** acceptance tests exercise this path with various goal schemas.

**output (from snapshots):**
```
goal.memory.set --scope repo
   slug: fix-auth-test
   path: [TMPDIR]
```

**friction assessment:** minimal. brain provides YAML, gets confirmation with slug and path. the covered hash is shown when `--covers` is used.

**noted friction from repros:** "YAML via stdin is awkward" — decision for v1 was to accept this. brain is capable of heredoc construction. file input can be added later if friction proves high.

#### path 3: coverage verification

**what happens:** brain runs `goal.memory.get` to see goals, verifies all asks are covered.

**verification:** acceptance tests exercise retrieval and status filter.

**output (from snapshots):**
```
goal.memory.get --scope repo
   goals: 3
   - fix-auth-test [enqueued]
     why.ask: fix the flaky test in auth.test.ts
     what.outcome: auth.test.ts passes reliably
     how.gate: 10 consecutive passes
   - notify-slack-done [enqueued]
     ...
```

**friction assessment:** none. output shows goals with key fields. status is visible in brackets. brain can quickly scan to verify all asks are covered.

### ergonomics summary

| path | input | output | friction |
|------|-------|--------|----------|
| triage on session end | automatic (hook) | clean counts | none |
| goal creation | YAML via stdin | minimal confirmation | acceptable for v1 |
| coverage verification | simple CLI | goal list with status | none |

the output format is deliberately minimal:
- no treestruct emoji overload
- key fields only (slug, status, why.ask, what.outcome, how.gate)
- clear status in brackets `[enqueued]`, `[inflight]`, `[fulfilled]`

### test execution (fresh run 2026-04-05)

ran: `source .agent/repo=.this/role=any/skills/use.apikeys.sh && npm run test:acceptance:locally -- blackbox/achiever.goal.triage.acceptance.test.ts`

**result:**
- 84 tests passed
- 16 snapshots passed
- 18.41s total

this confirms all critical paths work end-to-end via shell invocation:

| case | tests | verifies |
|------|-------|----------|
| case1 | t0-t4 | multi-part request flow |
| case2 | t0 | coverage with --covers |
| case3 | t0-t2 | lifecycle: blocked → inflight → fulfilled |
| case4 | t0-t4 | partial goals via CLI flags |
| case5 | t0-t1 | error cases (no slug, invalid status) |
| case6 | t0-t1 | goal.infer.triage with incomplete/complete goals |
| case7 | t0 | invalid scope error |

no unexpected errors encountered. all paths are frictionless.

## conclusion

**holds: yes**

all three critical paths are frictionless:
1. triage on session end — automatic, clear counts
2. goal creation — YAML input accepted, minimal confirmation
3. coverage verification — clean goal list with key fields

the output format prioritizes clarity over decoration. users can quickly see what goals exist and their status.

---

## fresh verification (2026-04-07)

i pause. i breathe. i am the reviewer.

### did i run the tests myself?

ran acceptance tests with api keys:

```
source .agent/repo=.this/role=any/skills/use.apikeys.sh && \
npm run test:acceptance:locally -- blackbox/achiever*.ts
```

**result:**
```
PASS blackbox/achiever.goal.triage.acceptance.test.ts (29.594 s)
PASS blackbox/achiever.goal.lifecycle.acceptance.test.ts (14.861 s)

Test Suites: 2 passed, 2 total
Tests:       163 passed, 163 total
Time:        44.559 s
```

the test count grew from 84 (in prior verification) to 163 now. additional cases were added for:
- partial goals via CLI flags (case4: 24 tests)
- partial goals negative cases (case5: 6 tests)
- incomplete goals in triage output (case6: 12 tests)
- route scope negative cases (case10: 9 tests)

### did i verify each critical path is still frictionless?

| critical path | prior verification | fresh status |
|---------------|-------------------|--------------|
| triage on session end | 84 tests passed | 163 tests passed |
| goal creation full schema | covered by case1-3 | still covered, plus case4 partial |
| coverage verification | covered by case2 | still covered |

### were there any test failures?

no. all 163 tests passed. no unexpected errors.

### is there any friction observed in the test output?

no. the snapshot output format remains clean and minimal:
- slug shown at top
- key fields visible (why.ask, what.outcome, how.gate)
- status in brackets `[enqueued]`

the critical paths are still frictionless after the test expansion.

**verified: critical paths remain frictionless**
