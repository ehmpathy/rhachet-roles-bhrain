# self-review r3: has-pruned-yagni

## deeper YAGNI review after r2 feedback

the guard said "the pond barely rippled" — I need to look harder for extras.

---

## potential YAGNI 1: do we need ALL status test cases?

the blueprint lists tests for:
- `status.choice = 'incomplete'` (two variants)
- `status.choice = 'enqueued'`
- `status.choice = 'inflight'`
- `status.choice = 'blocked'`
- `status.choice = 'fulfilled'`
- mix of statuses

**question**: could we test fewer? e.g., just 'incomplete' vs 'not incomplete'?

**answer**: the wisher said "thorough positive and negative test coverage on all edgecases". each status is a distinct edge case. incomplete is special (triage needed). blocked, fulfilled, etc. are all "past triage" but represent different lifecycle states.

**verdict**: keep all. wisher explicitly asked for thorough coverage.

---

## potential YAGNI 2: is the "mix of statuses" test redundant?

we already test each status individually. do we need a mix test?

**question**: what does the mix test prove that individual tests don't?

**answer**: the mix test verifies correct partition when BOTH incomplete and non-incomplete goals exist in the same scopeDir. individual tests only prove one-status scenarios.

**verdict**: keep. the mix test covers the partition logic boundary.

---

## potential YAGNI 3: is implementation order necessary?

the blueprint specifies:
1. getTriageState.ts first
2. tests second
3. goal.ts third
4. etc.

**question**: is this over-specification? could the implementer figure this out?

**answer**: yes, the implementer could figure it out. but to specify order:
- prevents broken intermediate states
- documents dependencies (goal.ts depends on getTriageState fix)
- costs little (7 lines)

**verdict**: keep. low cost, high clarity. not abstraction, just documentation.

---

## potential YAGNI 4: do we need negative tests for old --mode and old skill name?

the blueprint specifies:
- test that `--mode flag (old)` errors or is ignored
- test that `goal.infer.triage (old name)` fails

**question**: is this extra? the renames are obvious.

**answer**: these tests document the hard break. if someone references old docs or old hooks, the tests prove the old interface is gone. this is defensive, not YAGNI.

**verdict**: keep. hard breaks warrant negative tests.

---

## potential YAGNI 5: could the codepath tree be simpler?

the codepath tree has many `[○] retain` markers.

**question**: do we need to list what we're NOT about to change?

**answer**: yes. the retain markers show scope — reader knows what's touched vs untouched. helps reviewer verify no unintended changes.

**verdict**: keep. aids review without extra implementation cost.

---

## what I actually questioned vs r2

| item | r2 question | r3 deeper question |
|------|-------------|-------------------|
| test cases | "was it requested?" | "do we need ALL of them?" |
| implementation order | "is it standard?" | "could implementer figure it out?" |
| negative tests | not questioned | "is this defensive or YAGNI?" |
| codepath retain markers | not questioned | "do we need these?" |

r2 was too surface-level. r3 actually questioned necessity.

---

## summary

all components survive deeper YAGNI scrutiny:
- tests: wisher asked for thorough coverage
- implementation order: low cost, high clarity
- negative tests: hard breaks need proof
- retain markers: aid review

no YAGNI to prune.

