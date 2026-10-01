# F20 — the advisory re-reads the guard, per tick

**rework** = 🔴 **dirty** · **status** = open · **confidence** = 80%

## .the fork

`case=10`'s bound reads: a stone that declares no brain must **pay naught**. the BRAIN half honors it
— `applyStoneBrainOnEntry` and `setStoneBrain` both return before any repo-root lookup or probe, and a
positive non-invocation unit test pins that.

the **ADVISORY** half does not short-circuit. `stepRouteDrive.ts:284` hoists

```ts
const stdoutGuardWarns = await getStoneGuardWarns(stone.guard ?? null);
```

before the branches, and `getGuardParseWarnings` does an `fs.readFile` plus a line-by-line walk of the
guard on **every** tick, for **any** stone that carries a `.guard` — brain-declared or not, near-miss
or not.

**the fork:** fold the warn into the parse that already happened, or leave the second read.

## .taken, and why at the time

**leave the second read**, and pin the bound on **bytes** rather than on I/O.

## .the counter-case, stated fairly

the `i020 r008` lane raised it as a blocker and its case is sound: *"the same PR that one half built
against 'pays naught' shipped a companion half that adds a disk read + string walk to every guarded
stone in every repo, per tick"*, and no test asserts `getGuardParseWarnings` is never called for a
clean guard, where the brain path has exactly such a clamp.

⚠️ **re-raised at `i023 r011 new.2`** — so the counter-case has now been put twice, by two lanes, on
two rounds. that is a signal about the CALL rather than about either lane: a deferral two independent
reviewers reach for is one a council should actually rule on, over one that keeps drawing an answer.

### 🔴 what changed since — the byte-identity half now HAS a clamp, on the wire

the objection above is two claims, and only one of them still stands:

| the claim | as of 2026-09-16 |
|---|---|
| no test asserts a clean guard yields a byte-identical drive | ✅ **answered.** `blackbox/driver.route.brain.acceptance.test.ts [case4]` drives a real route with NO guard and snapshots stdout; `[case2]` snapshots the same body under an advisory. the two snapshots share a byte-identical drive body |
| no test asserts `getGuardParseWarnings` is never CALLED for a clean guard | 🔴 **stands, and deliberately.** the operation MUST be called — its return is `[]`, never its absence. an I/O clamp is the dirty fold's to buy, and it is the very act this fulcrum reserves |

⇒ **the split matters, because the two were argued as one.** what `case=10` demoes is the OUTPUT
bound, and that is now pinned end to end. what is unpinned is the I/O bound, which the case's own
tests decline to assert — so a council that upholds this call upholds a gap whose exact shape it can
now see.

## 🔴 .the measurement that decided it — the MARGINAL cost, not the absolute

the lane priced the read against zero. the correct baseline is what a tick already does:

```ts
// getAllStones.ts:35-37 — runs on EVERY tick, today, before this feature existed
const guard = guardPath
  ? await parseStoneGuard({ path: path.join(input.route, guardPath) })
  : null;
```

⇒ `getAllStones` **already reads and line-walks every guard in the route, one per stone, on every
tick.** so the advisory adds **one** read of the **current** stone's guard where the baseline does
**N**.

| the route | reads per tick, before | after | delta |
|---|---|---|---|
| this one, 14 stones | 14 | 15 | **+7%** |

⚠️ **so `case=10`'s bound is honored on the axis it demoes and tested on that axis.** a clean guard
yields `[]` → `''` → a **byte-identical** drive, which is what `case=10` `[t0]` asserts. what is
violated is the bound's *gloss* — *"no subprocess, no output line, no turn"* read outward to *"no
disk read"* — an axis the case's own tests explicitly decline to assert.

🟡 **and the advisory cannot be made conditional on `brain:` without a defect.** `F4`'s verdict made
the near-miss detector the **sole** defense for `case=4`, and it covers ALL known keys. a warn that
fired only for brain-adjacent keys would drop `artifacts:`/`judges:` near-misses on the floor — the
exact failhide that verdict was cast to prevent.

## .rework, and why 🔴 dirty

the fold needs the warn to ride out of the parse that already ran, and there are exactly two shapes
and both ripple:

| shape | what it costs |
|---|---|
| carry `warnings` on `RouteStoneGuard` | 🔴 parse metadata on a **domain object** — the split at `parseStoneGuard.ts:267` exists to keep it out |
| return `{ guard, warnings }` from `parseStoneGuard` | 🔴 a contract change through `getAllStones.ts:36` and every caller of it |

⇒ **SAFE ✅ · CLEAN 🔴.** a legitimate defer under `rule.always.fix-forward-under-scouts-honor`, and
that rule's own clause is why this row exists: *"a fix deferred for DIRT gets both"* — the dream
records the work, this records the judgment.

## .confidence, 80% → 🔴 **75%**

the marginal-cost measurement is first-party and the arithmetic is not in doubt. the residual is a
**judgment** the council may reverse: whether a bound demoed on bytes may be read outward to I/O. a
wisher who reads *"pays naught"* literally would call +7% per tick a violation, and this call would
then owe the dirty fold.

🔴 **dropped 5 points on 2026-09-16, and the two movers pull opposite ways:**

| the move | direction |
|---|---|
| a SECOND lane reached for the same fold, on a later round, with no sight of the first | 🔴 **down.** one reviewer is a reading; two independent ones is a pattern about the call |
| the output half of their shared objection is now clamped end to end | ✅ up, and by less — it answers what `case=10` DEMOES, never what the lanes ASK for |

⇒ a re-raise is not itself a refutation, and to treat it as noise would be the error this drop
guards against. **the honest read: the arithmetic holds and the judgment is contested**, which is
precisely the state a council exists to settle rather than one a driver should settle alone.

## .where

- the dream — `.dream/v2026_09_14.amend.guard-parse-warnings-re-reads-the-guard-file.md`
- the raise — `i020 r008 blocker.2`, `behavior-intent-coverage`; re-raised `i023 r011 new.2`
- the bound — `1.vision.experience.case=10.the-stone-declares-no-brain.md`
- the code note — `src/domain.operations/route/guard/getGuardParseWarnings.ts`, which now POINTS
  here rather than argues the deferral on its own (`i023 r011 new.2`). it argued it alone until
  2026-09-16, which is the `F23` class this call was the first instance of
- the output clamp — `blackbox/driver.route.brain.acceptance.test.ts [case2]`/`[case4]`

## .the verdict

open — for the fulcrum council.
