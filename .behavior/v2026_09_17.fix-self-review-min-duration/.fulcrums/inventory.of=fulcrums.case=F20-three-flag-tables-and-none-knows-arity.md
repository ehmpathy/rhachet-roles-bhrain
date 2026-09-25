# F20 — the round's `--into` repair adds a THIRD flag table, and none of the three knows arity

- **raised** = 2026-09-20, i015, lane `enroll-impl-arch-defects` (nitpick #4), **re-measured by the drive**
- **rework** = clean
- **status** = OPEN — deferred this round, with a dream
- **confidence** = 80%

## .the fork, stated fairly

the lane's nitpick, and it is aimed at the repair this very round shipped:

> *two flag-schema tables now exist, neither authoritative on the property that actually caused
> i014's bug … the structural fix is one flag-schema declaring `{ flag, valueRequired, allowedFor }`
> that both `parseArgs` and `getStrayFlagRefusal` read from … rather than a third bespoke check.*

⇒ **the third bespoke check is `FLAGS_THAT_REQUIRE_A_VALUE`**, added minutes earlier to close r007's
nitpick.1. the lane found the deeper shape independently, from the other side of the same defect.

| option | the claim |
|---|---|
| **A** — build `FLAG_SCHEMA` now, retire all three tables | the lane is right about the shape, and this round already made that exact move twice (`getStoneYieldGlob`, `getStonePromisePaths`) |
| **B** — ship the allowlist, and invert it so the default requires a value | the safer half of A: it closes the class without a new declaration surface |
| ✅ **C** — ship the allowlist as-is, defer the schema, with a dream and a delete-me docblock | the ripple is a **design act** rather than a merge, and it is not this stone's to make |

## .taken, and why AT THE TIME

**C.** and the reason is a count the drive measured rather than the lane's estimate — the lane read
*"~20 flags across 16 call sites"* and framed the fix as a **merge of two tables at parity**. it is
not:

| the table | flags it declares | scope |
|---|---|---|
| `parseArgs`'s lookahead | **0 declared** — it guesses arity from the next token | every command in `route.ts` |
| `asFlagOwnership` (`getStrayFlagRefusal.ts:38`) | **6** — `--with --about --why --severity --that --into` | 🔴 `route.stone.set` **alone** |
| `FLAGS_THAT_REQUIRE_A_VALUE` (added this round) | **1** — `--into` | arity only |
| **distinct flags actually read across `route.ts`** | 🔴 **26** | — |

🔴 **so the two tables do not cover one surface at different grains — they cover DIFFERENT SURFACES.**
`asFlagOwnership` knows 6 of 26, and only for one verb. a unified `FLAG_SCHEMA` must therefore widen
ownership from **6 → 26**, which means it must **declare ownership for 20 flags whose ownership has
never been declared anywhere** — `--route`, `--mode`, `--from`, `--mechanism`, `--grant`, `--peer`,
`--level`, `--add`, `--for`, `--open`, `--when`, `--yield`, and the rest.

⇒ that is not a refactor, it is **twenty new contract decisions**, each of which can be wrong in a
direction no test catches (a flag declared for too few verbs starts to refuse a call that worked).

**and B was refused for a measured reason too.** three flags are read as `=== 'true'` and depend on
the coercion the inversion would remove:

```
src/contract/cli/route.ts:970                    say:  options.say === 'true'
src/domain.operations/route/stones/asYieldModeForRewound.ts:14   hard: input.hard === 'true'
src/domain.operations/route/stones/asYieldModeForRewound.ts:15   soft: input.soft === 'true'
```

⇒ an inverted default requires the boolean set be **exactly** right on the first try, and a flag
absent from it stops to parse rather than fails loud. the allowlist's failure mode is the reverse —
an absent flag keeps today's behavior, which is a defect the lane can raise again rather than a
command that breaks.

## .rework, and why

**clean.** `FLAGS_THAT_REQUIRE_A_VALUE` is a private const in one file with one member, and its
docblock names itself the third table and marks itself for deletion. no caller hardens against it;
`FLAG_SCHEMA` would absorb its one row and delete the const. no later work in this round builds on
it.

## .confidence, and why it is not higher — 80%

the **counts** are measured (26 / 6 / 1 / 3), so the CLEAN verdict and the *"twenty new contract
decisions"* claim are not guesses. two things are unsettled:

- 🔴 **whether the ownership widening is genuinely owed.** a schema could carry `valueRequired` for
  all 26 and `allowedFor` for the 6 that have it, with the rest `allowedFor: 'any'` — which would
  make the fix a real merge after all, and much cheaper than this entry argues. the drive did not
  cost that variant, and a council that names it has a defensible position this fulcrum has not
  refuted
- **the drive is on record as pessimistic about ripple in this round** — `F17`'s entry says so, and
  `F19` was measured at 32 edits after two estimates were falsified high. ⇒ a count of touch points
  is not a count of effort, and this entry is a count of touch points

## .where

- the dream: `.dream/v2026_09_20.fix.two-flag-tables-and-neither-knows-arity.md`
- the third table, with its delete-me docblock: `src/contract/cli/route.ts` (`FLAGS_THAT_REQUIRE_A_VALUE`)
- the ownership table: `src/domain.operations/route/getStrayFlagRefusal.ts:38`
- the coercion: `src/contract/cli/route.ts` (`parseArgs`, the `else` branch)
- the three boolean readers: `route.ts:970` · `asYieldModeForRewound.ts:14-15`
- the lane's words: `…i015…r011._.given.by_peer.enroll-impl-arch-defects.md`, nitpick.4

## 🔴 .what this row shares with `F13`, and how it differs

`F13` is the round's other fulcrum whose defect the round **caused**. this is the second — the third
table did not exist before i015's repair.

⚠️ **the difference is who ruled it.** `F13` the drive ruled itself, and this index flags that as the
row a council should re-open first. this one the drive **defers to the council**, which is the
conduct `F13`'s entry says it should have taken. ⇒ the two rows are the same situation answered two
ways, one round apart, and a council can read them as a pair.

## .the verdict, once ruled

— not yet ruled.
