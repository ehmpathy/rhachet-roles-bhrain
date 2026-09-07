# F08 · the clean-reviewer cache-key seam is deferred, not fixed here

- **rework** = **dirty** · **status** = open · **confidence** = 70%

## .the fork, stated fairly

`case=8`'s boundary 6 surfaced that the guard's clean-reviewer cache keys on the **artifact hash** and not on the **rubric**. so a rubric tightened after a clean cache entry never re-grades the artifact it already approved.

| option | what it means |
|---|---|
| **fix it in this behavior** | change the guard's cache key to `hash(artifact) + hash(rubric)` |
| **defer it** | catch it as a dream; ship telepath's reviewer against the extant cache |

## .taken, and why at the time

**defer.**

- the seam is **not telepath-specific** — it affects every peer reviewer on every route. a fix belongs to the guard, not to a role behavior
- this behavior's declared scope is a role, its briefs, and one rubric. a cache-key change reaches machinery the diff does not otherwise touch
- the seam does not block telepath's reviewer from correctness on a **first** run, which is the run every acceptance line in the wish describes

## .why the rework is DIRTY — the one dirty fulcrum in this route

every other fulcrum here is reversible by an edit to a yaml, a boot list, or a brief name. this one is not:

- the cache is *shared* — every peer reviewer's verdicts flow through it, so a key change is a behavior change for reviewers this route never touched
- a key change *invalidates all extant entries on first deploy*, so the run after it lands re-grades every reviewer on every open route. that is a real cost paid by drivers mid-route, not by this behavior
- later work will build on whichever key shape ships, so a reversal after adoption is a teardown rather than an edit

🟡 **this is the fulcrum that could have earned a `--as blocked`, and it does not** — per `rule.always.defer-fulcrums-to-last`, a block needs a dirty rework *and* every other question already addressed. the inventory's own table names which fulcrums remain open, and the road is not yet at that point.

## 🟡 .what makes the deferral uncomfortable

the seam reproduces this wish's own motivation one layer down.

> *"an unreviewed reviewer is indistinguishable from a clean one."*

a stale cache entry is worse than that: the reviewer is **reported as reviewed**, from a verdict a superseded rubric rendered. and the artifacts most likely to hold the defect a tighter rubric hunts are exactly the ones already cached clean under the looser one.

⇒ so the deferral ships a reviewer whose own improvement loop has a silent hole in it. **that is on record here rather than minimized.**

## .confidence, and why it is not higher

70%. the scope argument is strong and the ripple argument is a **best guess** — I did not read the guard's cache implementation, so the blast radius of a key change is estimated, never measured.

⇒ if the key turns out to be cheap to widen and cheaply invalidated, the rework is clean and the call inverts.

## .where

- `.dream/v2026_09_04.fix.a-clean-reviewer-cache-keys-on-the-artifact-never-the-rubric.md` — the caught work
- `.behavior/v2026_09_04.feat-telepath-role/dreams/` — the symlink back to this route
- `1.vision.experience.case=8...md` — boundary 6, where it surfaced

## .the verdict

_unruled._
