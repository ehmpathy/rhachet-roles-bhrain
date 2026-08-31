# fulcrum F25 — `rerun-dark-review-lanes-scoped` split three ways, and seed #369's second half was reclassified

| field | value |
|---|---|
| **the fork** | A: leave the ejected rule verbatim and raise the defects to the wisher · B: repair it here — split the attribution half out, write the lost half, catch the root cause, rename the terms |
| **taken, and why** | **B, on three of the four repairs.** post-eject the file is bhrain's to own, and three of the four are markdown that closes a defect the eject imported. the fourth needs a term walk it cannot get this round |
| **rework** | **clean** — every piece is a file delete plus a `boot.yml` line; the parent rule's cut text is recoverable from git |
| **status** | 🔴 **half overturned** — repairs 1 and 3 are withdrawn; see **F27**. repair 2 stands |
| **where** | `src/domain.roles/driver/{hazard.since-main-diffs-attribute-main-to-your-branch.md, howdoes.the-guard-caches-a-clean-lane-by-artifact-hash.md, rule.always.rerun-dark-review-lanes-scoped.md}` |
| **confidence** | **~85%** |

## .the four repairs, and the verdict on each

| # | the repair | verdict | why |
|---|---|---|---|
| 1 | split the attribution half into a `hazard.*` | 🔴 **done, then UNDONE** | the attribution trap does not exist — `getAllFileDiffsFromRange.ts:70` already uses `git merge-base`. brief deleted; see **F27** |
| 2 | write the lost half of seed #369 | **done, RECLASSIFIED** | it is not a rule. see below |
| 3 | catch a dream for the guard's hardcoded `--diffs since-main` | 🔴 **WITHDRAWN** | there is no defect to entool around; same read as repair 1 |
| 4 | rename `dark` / `lane` | **deferred** | both are undeclared terms; `rule.require.enumerate-before-you-name` demands the instance list before the word, and that is a round of its own |

⚠️ **repairs 1 and 3 rested on the SAME unread claim**, so one source read voided both at once —
which is why F27 grades this a defect class rather than two mistakes.

## 🔴 .repair 2 was not a rule, and the reclassification is the decisive call

seed #369 describes a second lesson: *"when a src change is narrow, re-run only the lanes it could
have darkened — the guard caches terminal verdicts."*

**that is not a discipline a driver performs.** the guard does it unprompted. so a `rule.*` would
command an actor to do what the machine already does, and its enforcement line would be
unfalsifiable.

⇒ filed as `howdoes.*` instead — *"how does the machine work?"*, the reader is about to **reason**.
`rule.require.classify-the-yields-document-kind` (researcher) names the archetype, and its own
caution applies here word for word: *a repo with howtos and no howdoes teaches people to follow
steps they cannot reason about.*

## 🔴 .and this next section aged badly — read it beside F27

it praises a source read for repair 2. **repairs 1 and 3, written in the same pass on the same
seed, were never read against a source at all** — and the wisher overturned both the next day.

⇒ the lesson F23 taught was applied to the claim i doubted, and not to the claim beside it.
**a seed is one document; its claims are not one claim.** the section below stands as written,
because it is the evidence that half-application is the real failure mode.

## ✅ .and the mechanism was READ, not inferred — F23's lesson, applied

F23 records this exact drive ship a blocker-severity rule on a claim inferred from a tool's
signature rather than fetched. so this one was grepped first:

```
runStoneGuardReviews.ts:293  // reviews are cached by hash: same artifact content = reuse prior review
runStoneGuardReviews.ts:396  // skip if already approved (cached with no blockers)
runStoneGuardReviews.ts:399  if (cachedReview && cachedReview.blockers === 0) { ... }
```

**and the read refuted the seed.** the cache keys on the **stone artifact's content hash**, never
on which src files changed — so the seed's account is a consequence rather than the rule, and the
difference is material: an **artifact** edit re-runs every lane, where a **src** edit re-runs only
the lanes that blocked. that inversion is the most useful sentence in the new brief, and a rule
written from the seed's own words would have missed it.

## .why the confidence is ~85% and not higher

| the shaky part | why |
|---|---|
| **bhrain owns the file post-eject** | seed #369 says *"a follow-on PR removes it from `ehmpathy/rhachet`"* — and that removal has **not** happened. so two copies exist right now and this round diverged one of them |
| the split is a **judgment about archetype**, tested by no reader | `hazard` vs a `##` section inside the rule is exactly the call `rule.prefer.decompose-a-subject-via-suffixes` leaves to the author |
| both new briefs went to **`ref`**, not `say` | defensible against `role=any/boot.yml`'s stated policy, and it means a driver who never dereferences carries neither |

⚠️ **the divergence is the sharpest of the three.** it is defensible — an eject transfers ownership,
and the removal seed is already re-seeded per the wisher's Q1 default — but until rhachet's copy is
gone, a reader who finds both sees one file with an attribution section and one without.

## .what would settle it

- the follow-on removal lands in `ehmpathy/rhachet` → the divergence resolves itself, and this
  fulcrum closes
- a driver hits the attribution trap and reaches for the `hazard` unprompted → the split holds
- a driver batches their yield edits after a read of the `howdoes` → the `ref` tier was enough
- 🟡 a driver hits either trap and does **not** find the brief → the tier was wrong, and the repair
  is a promotion to `say`, not a rewrite
