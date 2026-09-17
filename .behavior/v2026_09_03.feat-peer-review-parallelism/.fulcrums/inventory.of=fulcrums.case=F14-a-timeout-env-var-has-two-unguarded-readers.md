# fulcrum F14 — a timeout env var has two unguarded readers, and this feature set the pattern that contradicts them

- **case** = F14
- **title** = a timeout env var has two unguarded readers, and this feature set the pattern that contradicts them
- **rework** = **clean**
- **status** = 🔴 **CLOSED 2026-09-12 — taken as A, repaired in-round. it leaves the board**
- **confidence** = **93%** at the time of the defer — see `.what closed it` for why the defer was reversed
- **raised** = 2026-09-12, at i004 r011 (`enroll-impl-arch-defects`, nitpick.3)

## 🔴 .what closed it

**i005 r011 re-raised it with a cost correction, and the correction is what flipped the call:**

> *"F14 is now unusually cheap to close, because `asGuardPositiveInt` is already written, already
> tested, and already imported in this diff. I'd push this from 'dream' to 'do it now'."*

⇒ **the reviewer was right, and the defer had been priced against the WRONG diff.** option A's cost
was estimated when `asGuardPositiveInt` had no test of its own; by i005 it carries 7 cases / 15
tests, so the repair was three one-line call-site edits against a clamped transformer.

| the repair | where |
|---|---|
| site 1 | `stepReview.ts` — `REVIEW_TIMEOUT_MS` reads `RHACHET_REVIEW_TIMEOUT_MS` through `asGuardPositiveInt` |
| site 2 | `runOneReview.ts` — `getReviewTimeoutMs`, same var, same transformer |
| 🔴 site 3 | `getReviewCountsViaBrain.ts` — `getFallbackTimeoutMs`, `RHACHET_FALLBACK_BRAIN_TIMEOUT_MS` |
| the live-path proof | `driver.route.peer-review-timeout.acceptance.test.ts` — **5 passed / 0 failed** |

🔴 **and the repair found a THIRD reader this row never named.** it reads a **different** env var, so
every survey keyed on `RHACHET_REVIEW_TIMEOUT_MS` — this row's, i004/r011's, and i005/r011's alike —
returned two. ⚠️ **its guard was the loosest of the three**: an `if (override)` truthiness test, so
`'0'` passed through as a truthy string and armed a timer that fires at once.

⇒ **the lesson generalizes past this row: a survey keyed on the SYMPTOM (one var's name) cannot bound
the CAUSE (an unguarded numeric env read).** caught as
`.dream/v2026_09_11.enbrief.a-scope-glob-picked-by-symptom-bounds-naught-about-cause.md`.

### .what was NOT taken from option A

the dream's shape asked to **lift and rename** `asGuardPositiveInt` out of the guard-parse module,
and to export a shared millisecond const. **both declined:**

- the lift buys a filename that reads better and touches every extant importer ⇒ fails CLEAN for a
  cosmetic gain
- 🔴 a shared const would **couple the three readers' DEFAULTS**, and those legitimately differ
  (`stepReview`'s literal `21 * 60 * 1000`, `runOneReview`'s per-reviewer `IsoDuration`, the
  fallback's `PT21M`). **the transformer is the right unit to share; the value is not**

## .the fork, stated fairly

this round added `RHACHET_LEVEL_CONCURRENCY` and validated it through `asGuardPositiveInt`. that
established a house pattern for a numeric env override — and **two extant readers of
`RHACHET_REVIEW_TIMEOUT_MS` predate it and contradict it**, each with a bare `parseInt` and no
validation (`stepReview.ts:162-165`, `runOneReview.ts:46-49`).

⇒ so the tension is one this feature **created**, by a stricter precedent laid beside a looser
incumbent. it did not author either incumbent.

| the option | what it costs |
|---|---|
| **A — route both readers through a validated transformer now** | lifts `asGuardPositiveInt` out of the guard-parse module and edits two files this diff never opened, one of which exports its result |
| **B — leave them, catch a dream, raise this row** | the contradiction ships: one env var read strictly here and loosely two modules away |
| **C — validate the new var loosely, to match the incumbents** | 🔴 refused outright — it trades a real guard for consistency with a defect |

## .taken, and why at the time

**B.** and the reviewer asked for exactly this: *"This is genuinely out of this PR's diff surface
(neither call site was authored by this feature), so I'm not asking for a fix here — just flagging
it as the natural next pull-thread."*

⇒ **C was never live.** `asGuardPositiveInt` exists because a `concurrency: 0` or a `concurrency:
-1` must be refused loudly; to drop that guard so the new var matches the old ones would make this
feature worse to close a consistency gap it did not open.

## .rework, and why it is CLEAN

one transformer, consumed at two call sites. no caller hardens against the current `NaN` behavior —
it is undefined by node's own docs, so no artifact on disk can depend on it — and the happy path for
a well-formed value is byte-identical before and after.

⇒ **clean, and yet deferred.** the same pair F11 and F12 carry: the *rework* is cheap to undo, and
the *fix in this diff* is not clean, because it opens two untouched files and lifts a module.
`rule.always.fix-forward-under-scouts-honor` asks both questions, and they answer differently here.

## .confidence, and why it is not higher

**93%.** the 7%: a wisher who reads *"this round established the pattern"* as *"this round therefore
owes the conform"* would want it swept now rather than queued. that is a defensible read — the
precedent genuinely is this branch's — and it turns on whether a new pattern obliges its author to
retrofit the incumbents it shames, which is a scope call the wisher owns.

⚠️ **what it does NOT turn on is whether the defect is real.** the two `parseInt` sites were verified
by grep on 2026-09-12, and a `0` or an `abc` value is mishandled today with no argument against it.
the open question is the schedule alone.

## .where

- `src/domain.operations/review/stepReview.ts:162-165` — `parseInt`, exported as `REVIEW_TIMEOUT_MS`
- `src/domain.operations/review/runOneReview.ts:46-49` — `parseInt`, per-review subprocess bound
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts:121` — this feature's validated
  reader, which cites the two above as its precedent
- `.dream/v2026_09_12.fix.a-timeout-env-var-has-two-unguarded-parseint-readers.md` — the caught fix

## .what would overturn it

— moot. it was closed by repair rather than by a verdict, so no open call remains to overturn.

⚠️ **what remains reviewable is the OMISSION**, never the fix: the lift and the shared const were
declined, and both declines are argued above. a wisher who wants either can ask for it as a clean,
additive follow-up.

## .the verdict, once ruled

🔴 **self-ruled by repair, 2026-09-12.** the defer was reversed the moment its cost estimate was
corrected — `rule.always.fix-forward-under-scouts-honor`'s SAFE/CLEAN test answers **yes/yes** once
the transformer is already clamped and imported, and at that point a dream is the wrong artifact.

⇒ **the row is kept rather than deleted**, because what it records is no longer the deferral — it is
that **a deferral priced against a stale diff surface reads exactly like a sound one.** three
independent surveys agreed on the defer, and one reviewer's re-price flipped it.
