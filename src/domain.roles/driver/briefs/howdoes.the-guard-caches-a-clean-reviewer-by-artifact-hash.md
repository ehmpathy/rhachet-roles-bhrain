# howdoes.the-guard-caches-a-clean-reviewer-by-artifact-hash

> **"if i re-arrive, does the whole ladder run again?"** — no, and the rule is narrower than most
> drivers assume.

## .the mechanism

`runStoneGuardReviews.ts` does two lookups before it runs a reviewer, and two facts do all the work:

| fact | consequence |
|---|---|
| the cache key is the **stone artifact's content hash** | a re-arrival that leaves the artifact byte-identical hits the cache for every reviewer |
| a reviewer is reused only when `blockers === 0` | a reviewer that raised a blocker **always** re-runs, cache or not |

🟡 **the cache check precedes the exhaustion check**, by design — a clean reviewer costs no budget
even when its budget is spent.

## 🔴 .a SRC edit is cheap; an ARTIFACT edit is not

the key is the **artifact**, never your diff, so the cost of a re-arrival inverts the naive guess:

| you changed | the hash | what re-runs |
|---|---|---|
| **src only** — the artifact untouched | unchanged | only the reviewers that had blockers |
| **the artifact** — one line of the yield | changed | 🔴 **every reviewer**, clean ones included |

⇒ **a one-word fix to a yield costs more reviewer time than a subsystem rewrite in `src/`.**

**measured** on `beav/feat-keyrack-unlock-scope`: a re-arrival after a narrow src change re-ran the
three l3 reviewers and **not one** l1 — ~815s rather than a full ladder. the l1 lanes were clean and
the artifact untouched; the l3 lanes carried blockers, so no cache applied at any hash.

## ⚠️ .this hash is the CACHE key, and it is NOT the debt key

| keyed to the artifact hash? | |
|---|---|
| ✅ a clean reviewer's **cached verdict** | this brief. an artifact edit kills it |
| ⛔ an unanswered blocker's **`.taken` debt** | keyed to the **reviewer**. an edit does not kill it |
| ⛔ a self review's **trigger** | keyed `(stone, slug)`. an edit does not re-trigger it |

⇒ **an edit buys a fresh ladder and no discharge at all.** a driver who reads this as *"an edit
resets the state"* has the cache right and the other two exactly backwards.

🔴 **row 3 was hash-keyed until 2026-09-17.** a driver who repaired the artifact mid-review reset
their own self-review clock, once per repair — so the gate charged the thorough driver and waved the
hasty one through. the promise it gates was already hashless, and that asymmetry was the defect.
⇒ the trigger now matches the promise, and a repair costs naught.

## .what a driver does with it

| the situation | the move |
|---|---|
| you fixed a blocker in `src/` and hesitate to re-arrive | **re-arrive** — clean reviewers cost naught. ⚠️ **write the `.taken` first**; the entrance gate refuses a round while you owe one, and the fix alone does not discharge it |
| the yield is **wrong** and you hesitate to touch it | 🔴 **fix it** — see below |
| you hold several **cosmetic** yield edits | batch them. one ladder, not four |
| a reviewer is exhausted but clean | it still passes; the cache precedes the exhaustion check |
| a reviewer is exhausted **with** blockers | no cache, and its blocker still owes a `.taken` — the debt outlives the budget |

## 🔴 .correctness outranks the cache

a driver who learns that an artifact edit re-runs the ladder can draw the wrong conclusion: *"then i
should not touch the yield."* **the yield is the deliverable; the ladder is the check on it** — to
leave a deliverable wrong so its check runs once fewer inverts the guard. and the economy is
imaginary: a yield left wrong fails its next review anyway, so the ladder runs regardless, against a
worse artifact.

⇒ so the rule this licenses governs **when to batch**, never whether to correct:

| the edit | the move |
|---|---|
| cosmetic — a reword, a typo, a table alignment | hold it; land them together |
| a correction — a wrong claim, an absent caveat, a stale section | land it the moment you find it |

## 🟡 .what it does NOT say

a re-arrival is not free and this licenses no coast. every reviewer that raised a blocker re-runs and
spends budget, so `rule.always.converge-with-reviewers` still governs what you owe each one — a
`.taken` per open point, every round.

## .provenance

read from `runStoneGuardReviews.ts` (the hash lookup, the `blockers === 0` reuse branch), never
inferred from behavior. the ~815s measurement is seed **#369**.

🟡 that seed calls it *"re-run only the reviewers a narrow src change could have darkened"* — a
consequence, not the rule. the guard keys on the artifact hash and knows naught about which src
files you touched, and that difference is what makes the artifact-edit case expensive.

## .see also

- `rule.always.diagnose-reviewer-malfunctions` — a reviewer that returned **no** verdict; this brief
  covers the ones that returned a clean one
- `rule.always.converge-to-terminal` — why a cheap re-arrival is the point
- `rule.always.spend-own-levers-before-escalation` — why budget stretches further than it looks
- `rule.always.converge-with-reviewers` — a cheap re-arrival still owes a `.taken` per open point
