# F14 — the applier converges rather than compares

**rework** = clean · **status** = ✅ settled 2026-09-11 by research · **confidence** = settled

## .the fork

at a stone boundary the applier holds a declared brain.

| candidate | what it does |
|---|---|
| compare, then set | read a believed current brain; dispatch only on a difference |
| **set unconditionally** | dispatch `/model <declared>` every boundary; hold no belief |

## .taken, and why

**set unconditionally.**

- `rule.require.fewer-paths-via-idempotency` (architect): a branch kept only to skip an idempotent
  re-run is a blocker. `/model X` converges on a re-run, and the compare is that branch
- a compare is blind by construction: after a hand-typed `/model`, its belief says the brain matches,
  so it skips every later boundary. a convergent applier repairs the drift at the next stone with no
  read — which also dissolves `F5`'s launch-time-vs-live doubt

## .the one fact that gated it

idempotent names the end state, never the path. if `/model` reset the conversation, an unconditional
set would wipe context 13 times on a 14-stone phase group.

> *"it preserves the conversation, no worries"* — the wisher, 2026-09-11

⇒ the re-run is benign, so the collapse is mandatory. a call gated on one binary observation is
recorded as the observation and its owner, never as a percentage.

## .what it did to the extant cases

| case | effect |
|---|---|
| `case=6` — the brain is already right | its pre-dispatch compare is the branch deleted; its record half stays |
| `case=3` — the slug the brain rejects | untouched — its check is post-dispatch |
| `F5` | the apply act reads no brain; only verify does |
| `case=8` | no *already* / *switched* distinction — there are no no-ops |

## .rework

clean — to reverse it is to restore an `if`.

## .where

`1.vision.experience.case=6.the-brain-is-already-right.md` — `[t0]`, `[t1]`, its `freq × cost` grade.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F14-the-applier-converges-rather-than-compares.md`
