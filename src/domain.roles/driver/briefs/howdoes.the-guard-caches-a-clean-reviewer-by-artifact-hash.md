# howdoes.the-guard-caches-a-clean-reviewer-by-artifact-hash

## .what it answers

> **"if i re-arrive, does the whole ladder run again?"**

no. and the rule that decides is narrower than most drivers assume, so this brief states the
mechanism rather than a discipline — a driver who knows it **reasons** about the cost of a
re-arrival instead of fearing one.

## .the mechanism, from the source

`runStoneGuardReviews.ts` does two lookups before it runs a single reviewer:

```ts
// reviews are cached by hash: same artifact content = reuse prior review
const priorArtifacts = await getAllStoneGuardArtifactsByHash({ stone, route, ... });

// skip if already approved (cached with no blockers)
if (cachedReview && cachedReview.blockers === 0) { /* reuse, spend no budget */ }
```

two facts do all the work:

| fact | consequence |
|---|---|
| the cache key is the **stone artifact's content hash** | a re-arrival that leaves the artifact byte-identical hits the cache for every reviewer |
| a reviewer is reused only when `blockers === 0` | a reviewer that raised a blocker **always** re-runs, cache or not |

🟡 **the cache check runs BEFORE the exhaustion check**, by design — the source comment cites the
wisher: *"if that review has said all good already, then its already cached and budget wont be
used."* so a clean reviewer costs no budget even when its budget is spent.

## 🔴 .the counter-intuitive half — a SRC edit is cheap, an ARTIFACT edit is not

the key is the **artifact**, never your diff. so the cost of a re-arrival inverts the naive guess:

| you changed | the hash | what re-runs |
|---|---|---|
| **src only** — the stone's artifact untouched | unchanged | only the reviewers that had blockers |
| **the artifact** — one line of the yield | changed | 🔴 **every reviewer**, clean ones included |

⇒ **a one-word fix to a yield costs more reviewer time than a subsystem rewrite in `src/`.** that
is the fact worth carrying, and no discipline substitutes for it.

## .the measured case

on `beav/feat-keyrack-unlock-scope`, a re-arrival after a narrow src change re-ran the **three l3**
reviewers and **not one** l1 reviewer — **~815s** of reviewer time rather than a full ladder.

the l1 reviewers were clean and the artifact was untouched, so all of them hit the cache. the l3 reviewers
carried blockers, so no cache applied to them at any hash.

## .what a driver does with this

| the situation | the move |
|---|---|
| you fixed a blocker in `src/` and hesitate to re-arrive | **re-arrive.** the clean reviewers cost naught |
| the yield is **wrong** and you hesitate to touch it | 🔴 **fix it.** see below — this brief must never be the reason a yield stays wrong |
| you hold several **cosmetic** yield edits | batch them into one touch. one ladder, not four |
| a reviewer is exhausted but clean | it still passes; the cache precedes the exhaustion check |
| a reviewer is exhausted **with** blockers | no cache. add budget (`rule.always.spend-own-levers-before-escalation`) |

## 🔴 .this must NOT discourage a yield edit — correctness outranks the cache

a driver who learns that an artifact edit re-runs the ladder can draw exactly the wrong conclusion:
*"then i should not touch the yield."* that inference is a defect, and it is the costlier one.

| what you spare | what it costs |
|---|---|
| one ladder — minutes of reviewer time, cents of spend | a yield that misstates the outcome, read by every downstream traveler, forever |

⇒ **the yield is the deliverable; the ladder is the check on it.** to leave a deliverable wrong so
its check runs once fewer inverts the whole point of the guard.

so the rule this mechanism licenses is narrow, and it governs when to batch rather than whether to
correct:

| the edit | the move |
|---|---|
| cosmetic — a reword, a table alignment, a typo | hold it, and land them together |
| a correction — a wrong claim, an absent caveat, a contradiction, a stale section | land it the moment you find it, whatever the ladder costs |

⇒ a yield left wrong to spare a re-run will fail its next review anyway, so the economy is
imaginary — the ladder runs, and it runs against a worse artifact.

## 🟡 .what this does NOT say

it does not say a re-arrival is free, and it does not license a coast. every reviewer that raised a
blocker re-runs and spends budget, so `rule.always.converge-with-reviewers` still governs what you
owe each one — a `.taken` per open point, every round.

## .provenance

the mechanism is read from `src/domain.operations/route/guard/review/runStoneGuardReviews.ts`
(the hash lookup and the `blockers === 0` reuse branch), never inferred from behavior. the ~815s
measurement is reported in seed **#369**.

🟡 **that seed describes the mechanism as *"re-run only the reviewers a narrow src change could have
darkened"*, which is a consequence and not the rule.** the guard keys on the artifact hash and
knows naught about which src files you touched — and the difference is exactly what makes the
artifact-edit case above expensive.

## .see also

- `rule.always.diagnose-reviewer-malfunctions` — what to do with a reviewer that returned **no**
  verdict, overflow included; this brief covers the reviewers that returned a clean one
- `rule.always.converge-to-terminal` — why a cheap re-arrival is the point: the ladder is meant to
  be walked to its end, not hoarded against
- `rule.always.spend-own-levers-before-escalation` — budget is the driver's lever, and this
  mechanism is why it stretches further than it looks
- `rule.always.converge-with-reviewers` — a cheap re-arrival still owes a `.taken` per open point
