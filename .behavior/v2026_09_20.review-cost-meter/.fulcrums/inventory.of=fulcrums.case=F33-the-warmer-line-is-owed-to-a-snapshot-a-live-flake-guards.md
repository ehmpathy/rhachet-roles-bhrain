# F33 — the warmer's stdout line is owed to a snapshot a live flake guards

- raised = 2026-09-25, in the ninth audit pass over the warmer bars (an acceptance sweep, not a review)
- rework = 🔴 **dirty**
- status = 🟡 **BEST-GUESSED — option A: hand-fix the clean suite, defer the guarded one.** never a
  `--resnap` — a live brain is drifting and would pin its opinion
- confidence = 🔴 **72%** (opened at 80%, cut by this row's own mid-pass correction)

## .how it was found — an instrument nobody had pointed at the warmer

the eight prior passes read the warmer's **own** bars against their **own** clamps. this one ran
the repo's broad acceptance sweep and read the failures, which is a different instrument and found
a different class: **the warmer's stdout line reached four suites that never asked for it.**

⇒ `rhx review` now prints a `🦉 warmer: …` block. every blackbox suite that captures that stdout
verbatim carries a snapshot that predates it, so each went red — and none of them is a warmer test.

## .what the sweep actually returned

**3790 passed, 19 failed.** the 19 sort into three causes, and only one is the warmer's:

| suite | failures | cause | owner |
|---|---|---|---|
| `review.by.acceptance` | 3 | 🔴 **the warmer line, and no more** (`+0 / −2` on each) | this branch |
| `review.by.guard-peer.acceptance` | 12 | the warmer line, **interleaved with** a verdict drift | 🔴 **mixed** |
| `review.by.learner.acceptance` | 3 | verdict drift alone (`exit 2` because a rubric rejected) | a peer / a flake |
| `review.conversation-help.acceptance` | 1 | a peer's `--polluters` help text moved after the snapshot | a peer |

🟡 **the verdict drift is one cause, seen twice.** the `term-aggregation` rubric returns **1
blocker** on a fixture whose own name says *"code is clean"*, on **some** attempts —
`[case-wrapper]` failed at attempt 3 and `[case-all]` at attempt 1. that is the `F21` shape
exactly: a live model's opinion pinned by an exit code. locally `REPEATABLE_CONFIG` grades `EVERY`,
so one flaked attempt reddens the suite; CI grades `SOME` and would absorb it.

### 🔴 the mid-pass correction — this row's first premise was drawn from a sample of TWO

the paragraph above originally read *"the guard-peer diffs interleave the warmer line with a verdict
drift"*, full stop — **and that was inferred from 2 of the 12 diffs**, both of which happened to be
the tangled kind. a count of the `± n` headers refuted it:

| the 12 guard-peer failures | shape | separable by hand? |
|---|---|---|
| **6** | 🔴 `− 0 / + 2` — the warmer line ALONE, verdict HELD (`0 blockers`, `all good 👍`) | ✅ **yes** |
| 6 | the warmer line tangled with `approved → rejected` | 🔴 no |

⇒ **half the failures were separable and the fork had declared them all tangled.** the verdict below
survives the correction, and its REASON changed entirely — which is the sharp part: a deferral whose
premise is a sample reports with an audit's confidence, and this branch has now recorded that
species five times (`F27`, `F29`, `F30`, and here).

🟡 **caught only because the premise was measured before it was written down as settled.** the
instrument was a grep of the diff headers — seconds, against four reads of prose.

## .the fork

> **does the warmer's stdout line get written into every snapshot that now misses it, or only
> into the ones no live verdict guards?**

| | option A — hand-fix the clean suite, defer the guarded one | option B — resnap all four now | option A′ — also hand-fix guard-peer's 6 separable entries |
|---|---|---|---|
| `review.by.acceptance` | ✅ hand-written, exact, 188 green | ✅ | ✅ |
| `review.by.guard-peer` | 🔴 deferred whole — a dream + this row | 🔴 **pins `1 blocker` on a fixture named *clean*** | 🟡 6 of 12 clear; **the suite stays red** |
| `review.conversation-help` | left to the peer whose text moved | 🔴 adopts a peer's in-flight text as settled | left to the peer |
| cost | 3 snapshot entries by hand, verified green | one `--resnap`, seconds | 🔴 **9** entries by hand, 6 of them whitespace-exact in a peer's file |
| risk | the guard-peer gate stays red until the flake is settled | 🔴 **a snapshot that asserts the opposite of its own case name** | a silent whitespace error, in entries a later resnap redoes anyway |

🟡 **option A′ did not exist when this fork was first written** — it became visible only once the
6/6 split was measured. it is the honest runner-up, and it loses on economics rather than on safety.

## .what was taken, and why AT THE TIME

**option A**, and the deciding reason is a rule this repo already paid for:

🔴 `rule.forbid.overzealous-blockers`' worked pair names *"a snapshot pins `malfunctioned 💥` for
cases whose own names say the guard APPROVES"* as the blocker half of its demo — because **every
future reader then trusts a lie.** a `--resnap` under a live verdict drift manufactures exactly
that artifact, and it does it silently, which is worse than the red gate it replaces.

so:

1. **`review.by.acceptance` was repaired by HAND, never by `--resnap`.** its three failures were
   `+0 / −2` — the warmer line and no other change — so the exact added text was knowable, and a
   hand edit puts precisely that in and cannot absorb a flaked verdict. re-run: **188 passed, 0
   failed**, which is what proves the edit was exact rather than merely plausible.
2. **the guard-peer snapshot was left alone — and its reason is NOT the one first written.** the
   correction above shows **6 of its 12** failures are separable, so *"you cannot hand-fix it"* is
   false. the reason that survives is a cost-versus-risk read, and it is weaker than the original:

   | | |
   |---|---|
   | the gain | 6 of 12 red would clear. 🔴 **the suite stays red either way**, so no gate turns green |
   | the cost | 6 hand edits in a **peer-modified** file, each on a nested line whose added text carries **trailing whitespace** (`│  │·· `) — the one shape a hand edit gets silently wrong |
   | the alternative | 🔴 once the flake settles, **one `--resnap` does all 12 correctly**, so the hand work is work the eventual resnap repeats |

   ⇒ so the 6 are deferred **with the other 6**, on economics rather than on impossibility. the
   residual is legible either way, because this row now states the 6/6 split by measurement.
3. **the conversation-help snapshot was left alone** — the drift is a peer's `--polluters` wording,
   `review.ts` moved at 22:13 against a snapshot last written 14:56. 🟡 **observed, never assumed**
   (`F30`'s lesson): mtimes read, `git status` read, the string grepped to both its sites.

## .the defect this pass DID fix, and why it is not deferred

the same sweep surfaced a real `0.wish` bar 4 defect in the line itself, and that one was **clean**,
so it was fixed in the hour (`rule.always.fix-forward-under-scouts-honor`):

> the refusal read **`no guard drove this review, so it has no next round to warm`**

that is FALSE of a case that ships. `asReviewRunIdentity` reads the **peer** grammar, so it answers
null for two different situations:

| the run | did a guard drive it? | is a next round due? |
|---|---|---|
| a hand `rhx review` | no | no |
| 🔴 a guard-driven `review.by` | **yes** | **yes** — the wrapper just writes to `.reviews/by=…/rubric=….md` |

⇒ so the stdout asserted, of a review a guard plainly drove, that no guard drove it. that is an
**`unknown` rendered as a FACT** — the exact inversion bar 4 exists to refuse, reproduced in prose
one layer out from the meter that refuses it in arithmetic.

**the repair** states what was unrecoverable rather than what happened:
`this run carries no lane identity, so there is no prefix to key a warmer on`.

**clamped, and proven red both ways** — `reviewWarmerSilence.acceptance` gained a positive
(`toContain('no lane identity')`) and a discriminator (`not.toContain('no guard drove')`); the
neuter took **6 of 18** red, 3 attempts × both.

## 🔴 .and the question it raised was the one worth asking

*"if a guard-driven `review.by` gets no warmer, do REAL lanes get one?"* — because if they do not,
the whole lever is dead code and bar 14's purpose clause is unmet.

**measured, not assumed:** `runStoneGuardReviews`' `substituteVars` binds `$output` to the **peer
report path**, and every level-1 peer lane in `5.1.execution.from_vision.guard` runs
`$rhx review … --output "$output"` directly. so the lane resolves and the warmer spawns. ✅ the
i002 round corroborates it — 6 of 9 lanes stepped 0.0% → ~39% together.

⇒ the `review.by` null is **accurate in scope**. only its words were wrong.

## .the rework, and why DIRTY

| | |
|---|---|
| **safe?** | 🔴 **no** for the guard-peer snapshot. to resnap it under a live verdict drift pins a rejection on a fixture named *clean*, and every later reader inherits it as the contract |
| **clean?** | 🔴 **no.** `review.by.guard-peer.acceptance.test.ts.snap` is peer-modified in flight (last written 2026-09-23 14:25), and the flake that guards it is a peer's rubric, not this branch's code |

⇒ both `no`, so it is a dirt deferral, and a dirt deferral owes both artifacts: the dream records
the work, this row records the call.

## 🟡 .the confidence, and why it is not higher

**72%**, cut from 80% by this row's own correction — a fork whose stated reason was refuted mid-pass
does not deserve the confidence it opened with, even where the call survives. three doubts:

- 🔴 **the population was characterized from a sample, once already.** the 6/6 split is now
  measured, but the same instrument was available at the first draft and was not reached for. so
  the residual doubt is not about the split — it is about **what else on this page rests on 2 of N**

- 🔴 **a red gate is a real cost, and option A accepts it.** the guard-peer suite stays red until
  the flake is settled by whoever owns `term-aggregation`. anyone who runs the full acceptance
  sweep meanwhile reads 12 failures and must re-derive this attribution — which is the whole
  reason this row and its dream exist, and is still weaker than a green gate
- 🟡 **the flake is a hypothesis this pass cannot test.** *"nondeterminism"* fits the attempt-3 /
  attempt-1 skew, and so would *"a peer changed the rubric and it now legitimately finds a
  blocker"*. the two demand opposite repairs — wait it out, or fix the fixture — and naught here
  parts them. ⇒ the same open question `F21` already carries

## .where

- `blackbox/__snapshots__/review.by.acceptance.test.ts.snap` — the three entries repaired by hand
  (`[case3]`, `[case3neg]`, `[case15]`)
- `src/contract/cli/review.ts` — the refusal text, and the `.note` that now names both null cases
- `src/contract/cli/reviewWarmerSilence.acceptance.test.ts` — the positive + the discriminator
- `blackbox/__snapshots__/review.by.guard-peer.acceptance.test.ts.snap` — 🔴 the deferred residual
- `.dream/v2026_09_25.fix.the-warmer-line-is-absent-from-a-guard-peer-snapshot-a-flake-guards.md`

## .the verdict

_(unruled — the council's)_

## .see also

- `F21` — the same live-model-opinion flake, from the other side: there it pinned an exit code,
  here it blocks a resnap
- `F27`, `F29`, `F30` — the three warmer rows whose deferrals were overturned within hours. this
  one differs in kind: its ground is **another party's live flake**, which this branch cannot expire
- `rule.forbid.overzealous-blockers` — the worked pair whose blocker half is exactly the artifact
  option B would have produced
