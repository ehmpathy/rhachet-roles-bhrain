# self-review: has-questioned-deletables

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.3.1.blueprint.product.v1.i1.md`

---

## features traceability

| feature | wish/vision reference | verdict |
|---------|----------------------|---------|
| Goal domain object | wish: "shape of a goal" (ask, task, gate, root) | KEEP |
| Ask domain object | wish: "accumulate each input" | KEEP |
| Coverage domain object | wish: "tie each ask to a goal" | KEEP |
| goal.memory.set | wish: "persist distinct goals" | KEEP |
| goal.memory.get | wish: "retrieve goals" (implied by persistence) | KEEP |
| goal.infer.triage | wish: "goal.infer.triage" explicitly named | KEEP |
| hook.onTalk | vision: "fires when peer sends message", accumulates asks | KEEP |
| hook.onStop | vision: "fires on session end", halts until triage complete | KEEP |
| briefs | wish: "briefs to seed the brain" | KEEP |

**all features trace to wish or vision.**

---

## components traceability

| component | traces to | verdict |
|-----------|-----------|---------|
| Goal nested schema (why/what/how) | wish: "shape of a goal" | KEEP |
| GoalStatusChoice enum | vision: status=enqueued/inflight/fulfilled | KEEP |
| GoalSource enum | wish: "from communications" vs "from internalizations" | KEEP |
| asks.inventory.jsonl | wish: "accumulate every input" | KEEP |
| asks.coverage.jsonl | wish: "tie each ask to a goal" | KEEP |
| .flag files for status | vision: explicit file structure | KEEP |

---

## simplification check

| component | simplest version? | verdict |
|-----------|------------------|---------|
| Goal schema | could we flatten? | no — nested structure forces thought |
| 5 domain operations | could we reduce? | no — each has distinct purpose |
| 3 skills | could we reduce? | no — maps to wish's named skills |
| 2 hooks | could we reduce? | no — onTalk and onStop serve distinct purposes |

---

## conclusion

**no deletables found.**

all features trace to wish or vision:
- domain objects: Goal, Ask, Coverage — all required
- domain operations: 5 operations — all required
- skills: 3 skills — all named in wish
- hooks: onTalk + onStop — both required by vision

the blueprint is minimal for the requirements.

---

## re-reviewed 2026-04-07

i pause. i breathe. i am the reviewer.

---

### delete candidate 1: could we remove the Ask domain object?

**question:** do we need a separate Ask object, or could we just store raw strings?

**analysis:**
- the wish says "accumulate every input" — raw strings would suffice
- but the vision says "each ask identified by content hash"
- the hash is critical for coverage track

**verdict: KEEP.** the hash enables:
1. deterministic deduplication (same ask = same hash)
2. coverage map (hash → goalSlug)
3. idempotent triage (reprocess safe)

without Ask as a domain object, we'd embed hash logic everywhere.

---

### delete candidate 2: could we remove the Coverage domain object?

**question:** do we need Coverage, or could we inline coverage in the Goal?

**analysis:**
- the wish says "tie each ask to a goal"
- alternative: store `coveredAsks: string[]` on Goal

**why that's worse:**
- if a goal is split, we must update Goal.coveredAsks
- if coverage is separate, split goals just update coverage entries
- separation enables the checklist pattern

**verdict: KEEP.** separation makes goal recomposition safe.

---

### delete candidate 3: could we remove the status flag files?

**question:** why separate `.status=*.flag` files instead of status in `.goal.yaml`?

**analysis:**
- the vision says "status.choice visible from filename alone"
- alternative: parse every yaml to find status

**why flags are better:**
- `glob('*.status=inflight.flag')` finds active goals in O(1) per file
- no yaml parse needed for status queries
- filesystem IS the index

**verdict: KEEP.** flags enable fast status queries without yaml parse.

---

### delete candidate 4: could we remove partial goals?

**question:** the blueprint allows partial goals via CLI flags. is this needed?

**analysis:**
- the wish does not explicitly mention partial goals
- but the criteria says "partial goals allowed for quick capture"

**why partial goals matter:**
- brain sees an ask, wants to capture it fast
- full schema friction would slow capture
- incomplete goals get triage reminder

**verdict: KEEP.** partial goals enable quick capture; triage reminds to complete.

---

### delete candidate 5: could we merge setAsk and setCoverage?

**question:** why two operations instead of one?

**analysis:**
- setAsk runs on every peer input (via hook.onTalk)
- setCoverage runs when brain covers an ask (via goal.memory.set --covers)

**why separation matters:**
- setAsk is automatic (hook fires)
- setCoverage is deliberate (brain decides)
- merge would couple automatic and deliberate actions

**verdict: KEEP.** separation preserves intent distinction.

---

## final verdict

all 5 delete candidates reviewed. all KEEP.

the blueprint is minimal for the requirements. no deletables found.

