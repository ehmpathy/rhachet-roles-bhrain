# self-review: has-behavior-declaration-adherance (round 8)

## pause

tea first. then, we proceed.

i am the reviewer, not the author.

---

## reviewed artifacts

- `.behavior/v2026_04_02.feat-achiever/1.vision.md` (from context)
- `.behavior/v2026_04_02.feat-achiever/2.1.criteria.blackbox.md` (from context)
- `.behavior/v2026_04_02.feat-achiever/3.3.1.blueprint.product.v1.i1.md`

---

## round 8: deeper adherance check

r7 verified surface-level adherance. r8 checks subtle requirements.

### edge case 1: coverage recheck on goal dir hash change

**vision says:**
> "the other benefit here is, we'll be able to detect that whenever the hash of the goal dir changes, we need to recheck which asks are covered and which are not"

**blueprint says:**
getTriageState reads inventory and coverage, computes uncovered. the "recheck on hash change" is implicit in the design — every time hook.onStop fires, it recomputes uncovered from current state rather than use a cache.

**verdict:** ADHERES — design enables detection by recompute rather than cache.

### edge case 2: asks in order for diagnosis

**vision says:**
> "its critical that we collect the asks in order so we can diagnose cases like when an ask was abandoned or changed mind on"

**blueprint says:**
line 165: "append: JSONL line to asks.inventory.jsonl"
JSONL append preserves order. receivedAt timestamp also enables order verification.

**verdict:** ADHERES — JSONL append pattern preserves insertion order.

### edge case 3: self-trust mode

**vision says:**
> "self trust is fine for now"

**blueprint says:**
no strict verification that every ask has a goal. brain triages and covers asks. system trusts brain's --covers declarations.

**verdict:** ADHERES — design uses self-trust, not automated verification.

### edge case 4: route.drive yields to triage

**vision says:**
> "it should be clear that `route.drive` hook should be skipped if `goal.infer.triage` is loaded; i.e., if `goal.infer.triage` will emit a stop code already, then route.drive should be silent"

**blueprint says:**
hook.onStop halts until triage complete. this naturally takes precedence over route.drive because the session cannot end until triage passes.

**verdict:** ADHERES — onStop halt enforces triage before session end, route.drive cannot override.

### edge case 5: scope (route vs repo)

**vision says:**
> "1. into the $route/.goals/ dir, if within a route"
> "2. into the reporoot/.goals/ dir, if not within a route"

**blueprint says:**
line 341: "hooks (onTalk, onStop) in `getAchieverRole.ts`"
line 220: "--scope: route | repo (persistence location)"

**verdict:** ADHERES — explicit scope parameter supports both locations.

---

## conclusion

**round 8 confirms: blueprint adheres to all subtle requirements.**

checked:
1. coverage recheck on change — recomputes each time
2. asks order preserved — JSONL append
3. self-trust mode — no automated verification
4. route.drive yields — onStop halt enforces triage first
5. scope flexibility — route or repo supported

no deviations. no misinterpretations.

---

## re-review 2026-04-07

i pause. i breathe. i am the reviewer.

---

### deeper check: hook.onTalk behavior

**vision says:**
> "`goal.infer.triage --from peer --when hook.onTalk` whouldn't halt the brain if its inflight on work"
> "it should just remind it, hey, if this might impact your goals - think through it first so you dont waste time"

**blueprint says:**
- line 234: "does NOT halt brain"
- treestruct output includes: "consider: does this impact your goals?"

**adherance:** YES — onTalk reminds but does not block

---

### deeper check: hook.onStop behavior

**vision says:**
> "`goal.infer.triage --from peer --when hook.onStop` will guarantee that it gets processed and not forgotten"

**blueprint says:**
- line 239: "halts until triage complete"
- acceptance test cases verify exit code 2 on uncovered

**adherance:** YES — onStop blocks until all asks are covered

---

### deeper check: ask hash for coverage

**vision says:**
> "each ask identified by content hash (deterministic, no counter needed)"
> "in order to complete `goal.infer.triage` so that the `onStop` hook stops the halt, each and every ask that was accumulated needs a distinct goal tied to it"

**blueprint says:**
- line 163: "compute: hash = sha256(content)"
- line 175: "construct: Coverage for each hash"

**adherance:** YES — uses deterministic content hash, coverage maps hash to goalSlug

---

### deeper check: goals on main forbidden

**vision says:**
> "goals on main branch are forbidden"

**blueprint says:**
- line 359 acceptance tests: "negative: main branch | --scope repo on main | exit 1, forbidden error"

**adherance:** YES — tests verify rejection on main branch

---

### deeper check: offset from parent dir mtime

**vision says:**
> "prefix is seconds offset from parent dir mtime"

**blueprint says:**
- line 127: "compute: offset from parent dir mtime"

**adherance:** YES — offset computation matches vision specification

---

## final verdict

eight rounds of review complete.

blueprint adheres to behavior declaration:
- hook.onTalk: reminds but does not halt
- hook.onStop: halts until triage complete
- ask hash: content-based, deterministic
- main branch: goals forbidden
- offset: computed from parent dir mtime

no deviations from vision. no misinterpretations of criteria.