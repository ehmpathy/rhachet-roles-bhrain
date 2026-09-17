# fulcrum F10 — one of three numeric keys is strict, and two stay loose

| field | value |
|---|---|
| **case** | F10 |
| **title** | one of three numeric keys is strict, and two stay loose |
| **rework** | clean |
| **status** | 🔴 **SETTLED 2026-09-10 — option B**, by this fulcrum's own overturn condition |
| **confidence** | 🔴 **99%** — the census that would overturn A was run, and it came back empty |
| **where** | `parseStoneGuard.ts` — `asGuardPositiveInt`, called from `concurrency:`, `budget:`, `level:` |
| **raised** | 2026-09-10, in self review 8/8 `role-standards-coverage` |
| **settled** | 2026-09-10, after three peer lanes raised it and the census priced it |

## .the fork

the review found `concurrency:` validated its bound on `parseInt`'s **answer**, so `concurrency: 2.5`
parsed clean and poured 2. the repair reads the raw text with `/^[0-9]+$/`. that repair put a strict
numeric key beside two loose ones in the same file, and the fork is what to do about the two.

| option | what it costs | what it risks |
|---|---|---|
| A — strict on `concurrency:` alone | an inconsistency a reader must be told about | a reader takes one-of-three as a settled convention |
| **B — strict on all three, this round** ✅ | a behavior change to two keys this diff does not touch | 🔴 **refuses any extant guard that carries a value the loose parser has taken** |
| C — loose on all three, revert the repair | naught | 🔴 the defect the review found ships |

## 🔴 .the verdict — B, and the census is what settled it

**A was taken first, and it was wrong.** what overturned it was written into A's own
`.what would overturn it` and then run:

> *"a census that comes back empty — walk every `.guard` in this repo and in each consumer, and if no
> `budget:` or `level:` carries a non-integer, B is free and should be taken"*

**walked 2026-09-10**, over every `.guard` in this repo:

| the probe | the result |
|---|---|
| `^\s*(budget\|level):` | **1,538 occurrences across 117 files** — the denominator |
| `^\s*(budget\|level):\s*(?![0-9]+\s*$)` | 🔴 **no matches** — zero non-integers |

⇒ B's stated risk — *"refuses any extant guard that carries a value the loose parser has taken"* —
**has an empty referent in this repo.** the migration A feared has no subject.

🟡 **a lower bound on the consumer half, stated plainly:** this worktree still cannot read consumer
repos, so the census is complete for this repo and a sample of one for the org. what makes B safe
anyway is the second argument, below — which needs no census at all.

## 🔴 .the argument A never made, and it is the one that decides

A graded *"does this refuse a value that is in service today?"* — a question about **incidence**. the
question it should have asked is about **sense**:

> **is there a non-integer `budget:` or `level:` that means what its author wrote?**

there is not, and the enumeration is short because the value space is:

| the value | what a loose parser binds | what the author could have meant |
|---|---|---|
| `2.5` | `2` | naught — a reviewer cannot run half a round |
| `1e3` | `1` | `1000`, and it binds at one — the widest possible miss |
| `1.9` (level) | `1` | the expensive rung; it runs on the cheap one, and unlocks it |
| `abc` | `NaN` | naught — and `rounds >= NaN` is false forever, so it **never exhausts** |

⇒ **a refusal cannot take away a behavior that was correct, because none of the four is correct.**
it can only surface a guard that was already silently wrong. so B's risk is not *"a guard that worked
breaks"* — it is *"a broken guard is finally reported"*, which is what `rule.forbid.failhide` asks for
outright.

🔴 **A had priced the wrong quantity**, and that is the reusable lesson:
`rule.require.enumerate-before-you-name` says enumerate the instances the word must cover. **I
enumerated the OPTIONS and never the VALUES.** the four rows above took one minute and they invert
the verdict.

## .what B cost, measured

| what | before | after |
|---|---|---|
| the check | one regex inline at `concurrency:` | `asGuardPositiveInt`, one transformer, three call sites |
| `parseStoneGuard.test.ts` | 34 cases | **41** — `[case16]` adds seven |
| the guard unit suite | 715 | **722** |
| the full unit suite | — | **1,640 passed, 0 failed** |

**teeth-proven:** reverted both call sites to a bare `parseInt(...)`. `[case16]`'s `[t0]`–`[t5]` went
red and the other 34 stayed green — `[case14]`'s five among them, **so `concurrency:` was already
strict and its tests are a WITNESS, where these six are a REPAIR**. `[t6]` stayed green by design: a
plain integer parses identically either way, and it is there because six red cases prove the refusal
and say naught about the pass.

## .who raised it

three peer lanes on i001, independently, and two graded it a blocker:

| lane | grade | its words |
|---|---|---|
| `arch-hazards-maintenance` r6 | 🔴 blocker | *"a typo'd budget makes a reviewer NEVER exhaust, an unbounded ladder with no line of output … this diff's own `concurrency` case demonstrates the fix pattern, so the lift is small"* |
| `ergo-friction-hazards` r9 | 🔴 blocker | *"the fix is one named transformer routed through three call sites — already sketched in the dream"* |
| `arch-hazards-behavior` r7 | nitpick | *"its two neighbours three hundred lines down still use `parseInt`, which reads a PREFIX … and then ships one-of-three strict as a settled convention"* |

⇒ **all three named the deferral itself as the defect, and r7 named it precisely**: one-of-three
strict reads as a convention rather than as an unfinished sweep. that is the mis-read this fulcrum
was opened to prevent, and **the fulcrum's own existence did not prevent it** — three reviewers read
the code, not the fulcrum.

## .the rework, and why it was clean

the check was one regex on one line. to widen it was to lift it into a named transformer and call it
from three sites. no contract moved, no caller changed, and the three `concurrency:` cases already
written were the template for the seven the other two keys owed. **the estimate held exactly.**

## .what would overturn it

- **a consumer census that comes back non-empty** — a `.guard` in a repo this worktree cannot read,
  that carries a non-integer `budget:` or `level:` whose author meant it. the four-row table above
  says no such value exists, so this would be a genuine surprise rather than a risk
- a shape the raw-text rule refuses that is legitimate yaml for a positive integer — `+5`, `05`,
  `5 # a comment`. **none appears in the 1,538**, and each would be one more branch in the regex
  rather than a return to `parseInt`

## .the dream it pairs with

`.dream/v2026_09_10.fix.budget-and-level-truncate-a-fractional-value-silently.md` — 🔴 **discharged
in this round.** the dream recorded the work; the census met this fulcrum's overturn condition, so
the work was done rather than deferred. the dream is kept as the record of the defect and its
diagnosis, marked done.
