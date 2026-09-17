# F22 — four lanes had their review scope narrowed by the party under review

- **rework** = clean
- **status** = open — best-guessed, offered for rework
- **confidence** = 84%
- **raised** = i022, at the moment the edit was made

## .the fork, stated fairly

at i022 four l1 lanes returned `constraint ✋` rather than a verdict: `repo-rules`,
`ergo-contract-snapshots`, `ergo-acceptance-journey-coverage`, and
`ergo-snapshot-visual-blemishes`. each overflowed the 75% context gate at **75.2–75.6% of
1,000,000 tokens**, on a target corpus of **118 files / 515.6k tokens**.

⇒ a lane that returns `constraint` is **terminal for unlock**, so l3 opened and spent its
budget while four rubrics graded **not one file**. and an unreviewed reviewer reads exactly
like a clean one.

the options:

| option | what it costs |
|---|---|
| **A. leave them dark** | four rubrics silently ungraded, on the stone whose whole subject is verification |
| **B. narrow each lane's `--paths-with`** | the driver chooses what its own reviewers see |
| **C. `--focus pull` on each** | full scope kept; the reviewer reads files rather than receives them |
| D. commit, to collapse `since-main` | 🔴 forbidden outright — `rule.forbid.commits-the-route-did-not-ask-for` |
| E. hand-run `rhx review` with a tighter scope | 🔴 forbidden outright — `rule.forbid.hand-run-reviews` |

## .taken, and why AT THE TIME

**B for three lanes, C for one** — and the split is the whole judgment.

the sanctioned lever for an overflowed lane is a **guard edit**
(`rule.always.spend-own-levers-before-escalation`, `rule.always.diagnose-reviewer-malfunctions`).
that settles *whether* to act. it does not settle *how*, and the two moves differ in what they
risk:

| lane | move | the reason it is honest |
|---|---|---|
| `ergo-contract-snapshots` | `--paths-wout 'src/domain.operations/**/*.ts'` | the rubric grades **contract** snapshot exhaustiveness. the contract surface is `src/contract/**` + `blackbox/**`, neither touched |
| `ergo-acceptance-journey-coverage` | same | the rubric grades **acceptance journeys**, which live in `blackbox/**` and `src/contract/cli/*.acceptance.test.ts`, neither touched |
| `ergo-snapshot-visual-blemishes` | same | the rubric grades **rendered output**. `*.ts` does not match `*.snap`, so **100%** of the corpus it reads survives |
| `repo-rules` | 🔴 `--focus pull` | its rubric is every rule this repo declares over every source file. **there is no honest subset**, so a `--paths-wout` here would drop coverage rather than noise |

⇒ the exclusion sheds **258k of the 530k** — the `domain.operations` `.ts` mass — and keeps every
`.snap` nested under it.

## 🔴 .why this is a fulcrum and not merely a fix

**a review-scope change made by the party under review is the exact shape two rules forbid in
their other two forms.** `rule.forbid.commits-the-route-did-not-ask-for` and
`rule.forbid.hand-run-reviews` both name it outright:

> *"the two unsanctioned moves are the same defect at two scales. a commit changes **what the
> reviewers can see**; a hand-run review changes **who reviews and under what terms**."*

the guard edit is the **sanctioned** third form — the lane still runs on the guard's terms, costs
a budget round, and mints a `.given` that gates. so it is legitimate by construction.

⚠️ **and it is still a scope call I made about my own reviewers, with no one to check the
rubric-to-corpus mapping but me.** that is what the row exists to surface.

## .why the confidence is 84% and not higher

| what holds it up | what holds it down |
|---|---|
| each exclusion is derived from the rubric's own named subject | I read the rubric titles, not every rubric file in full |
| the `*.ts` / `*.snap` distinction is mechanical, not a judgment | `--focus pull` trades render fidelity for scope — a pull reviewer may read less than a push one receives |
| the alternative is four rubrics that graded no file at all | a narrowed lane that approves is weaker evidence than a full lane that approves, and the tree does not say which it was |

⇒ 🔴 **the honest counter: a narrowed lane's approval means less than an unnarrowed one's, and
the guard tree renders that difference on no line.** a reader of the passage record sees
`approved` either way.

## 🔴 .OVERTURNED IN PART at i023 — option C was invalidated by a mechanism

**condition 2 below fired, and harder than it was written.** it anticipated that `--focus pull`
might return a *materially thinner* review than a push round. what happened is worse:

```
BadRequestError: focus 'pull' requires a brain with tool use (BrainRepl).
brain 'fireworks/deepseek/v4-flash' is a BrainAtom without tool use.
use focus 'push' instead, or choose a BrainRepl.
```

⇒ **pull returned no review at all.** so `repo-rules` went dark a second consecutive round, for a
wholly new reason, and graded not one file across i022 and i023 both.

### what this changes, and what it does not

| | before i023 | after |
|---|---|---|
| **option C** — `--focus pull` | a live option, taken for one lane | 🔴 **impossible at this brain.** struck from the option set outright |
| the three `--paths-wout` lanes (B) | taken, 84% | ⚠️ **unchanged** — this fires on C, and says not one word about B |
| `repo-rules` | C | 🔴 **split into two push lanes**, per condition 2's own prescription |

🔴 **and the prescription was already written down here.** condition 2 names
`repo-rules-src` / `repo-rules-blackbox` verbatim, so the remedy cost no new judgment — it was a
read of this file. ⇒ that is what an overturn condition is FOR, and it is the first one in this
round's inventory to fire and be acted on.

### 🟡 the split's own honest cost, stated rather than smoothed over

a split drops no file, so it is strictly better than an exclusion on coverage. it is not free:

> **a violation that SPANS the seam is now graded by nobody.** neither half sees `src/` beside
> `blackbox/`, so a rule about their relation — a test that should cite a `src/` symbol, a
> contract whose only consumer is a blackbox suite — falls between the two lanes.

⇒ narrower than an exclusion's loss (which drops files outright), and it is a loss.

### ⚠️ a second lane split at i023, and its cause is NOT a scope call

`mech-external-contracts` returned a clean `0/0` at i022 and `constraint` at i023 **with no change
to its bind**, at 77.2% on 120 files / 523.6k. the arithmetic puts ~248k of the 772k prompt in
`--conversation`, which grows on every arrival and shrinks never.

🔴 **so that lane's overflow is no scope judgment at all, and it does not belong to this fulcrum.**
it is an unbounded-growth defect in the tool, caught as
`.dream/v2026_09_16.feat.the-conversation-trail-grows-until-every-lane-overflows.md`. the split
there is a **stopgap that buys headroom**, and it is recorded as one in the guard's own comment.

⚠️ **the reason to part the two is that they decay differently.** a scope call is a judgment a
council can rule on once. an unbounded term re-breaks whatever the council rules — so to file them
together would hand the wisher a decision that cannot hold.

## .what would overturn it

- a lane narrowed here returns `approved` while a defect its rubric names sits in the excluded
  mass ⇒ the exclusion was not noise
- ✅ **FIRED at i023** — `--focus pull` on `repo-rules` returns a materially thinner review than its
  push rounds did ⇒ prefer a split into two push lanes (`repo-rules-src`, `repo-rules-blackbox`)
  over pull. *(acted on; see above. the real outcome was thinner than "thinner": no review at all)*
- 🔴 **a new condition, from the split** — a defect that spans the `src/` ⇄ `blackbox/` seam ships
  green while both halves approve ⇒ the split cut a relation the rubric was there to grade, and
  the honest move is one lane at a brain whose window fits it
- the wisher would rather four dark lanes than four narrowed ones ⇒ revert, and halt instead

## .where

`.behavior/v2026_09_03.feat-peer-review-parallelism/5.3.verification.guard` — each edit carries
its own reason as a comment above the lane, so the next reader finds it without this file.

## .the verdict, once ruled

_(open)_
