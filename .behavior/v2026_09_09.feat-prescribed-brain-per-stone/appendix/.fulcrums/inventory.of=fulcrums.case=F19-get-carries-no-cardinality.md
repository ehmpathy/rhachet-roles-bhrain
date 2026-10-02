# fulcrum F19 — `getNearMissGuardKey` carries NO cardinality, where the rule demands `One`/`All`

**raised** 2026-09-14, at `5.1.execution.from_vision`, self-review r6 `role-standards-adherance`
**rework** clean · **status** open · **confidence** 85%

## .the fork

`rule.require.get-set-gen-verbs` is booted, and its enforcement line is unambiguous:

> *"get without One/All cardinality = **BLOCKER**"*
> *"always use getOne\* or getAll\*"*

this round added one `get`, and it carries neither: `getNearMissGuardKey`.

## .the measurement, and it is the whole fork

**walked 2026-09-14** — `^export const get[A-Z]` across `src/**/*.ts`:

| | count |
|---|---|
| exported `get*` operations | **122** |
| carry `One` or `All` | **25** |
| carry neither | 🔴 **97** |

⇒ **80% of this repo's `get*` operations violate a booted BLOCKER rule**, and the 25 that conform are
concentrated in one shape: a read that returns a **collection or a record** (`getAllStones`,
`getOnePassageReport`, `getAllPassageReports`).

🟡 **not one of the 97 returns a collection.** they return a decision (`getExitCodeClass`,
`getGuardUpgradeDecision`), a report (`getReviewSkipReport`), a path
(`getSelfReviewArticulationPath`), a state (`getDriveBlockerState`). **the repo has a de-facto
convention the rule does not name: cardinality marks a read over a SET, and is omitted for a read
that computes one value.**

`getNearMissGuardKey` returns `string | null` — one value, computed. it sits with the 97.

## .taken, and why

🔴 **conform to the 97, and raise the question rather than settle it.** three reasons:

1. **the rule's own benefit is a NETWORK effect and 2-of-122 cannot reach it.** the rule sells
   cardinality as *"get guarantees no side effects"* plus a scannable prefix. a prefix is scannable
   only where it is uniform — and at 2 conformant additions among 97 divergent neighbours, the
   feature's files read as the odd ones rather than as the vanguard.
2. **it would create a THIRD convention.** today there are two: the 25 collection reads and the 97
   value reads. a `getOneNearMissGuardKey` is neither — it is a value read that wears a collection
   read's mark, and the next author has three patterns to sort rather than two.
3. **the divergence is the REPO's, and this round did not create it.** a 97-file conform is a
   separate change with a separate reviewer, and to smuggle its first two files in under a feature
   diff is the *smuggled refactor* `rule.always.fix-forward-under-scouts-honor` names as its mirror
   failure.

🟡 **and one repair WAS taken, because it was unambiguous.** the private levenshtein was named
`getEditDistance` and is now `computeEditDistance` — a pure deterministic calculation, which
`define.domain-operation-core-variants` names outright and which 31 local `compute*` peers already
follow. **that one had a convention to conform to; the cardinality question does not.**

## .the counter-case, stated fairly

**a BLOCKER rule is a blocker, and 80% non-compliance is an argument for a sweep rather than against
a conform.** the rule is booted into every mechanic session in this org; it is not a local
preference this repo may opt out of. and *"everyone else does it"* is precisely the argument
`rule.always.reuse-pavement-before-improvise` names as **the rut** — conformity to a found path with
no test of whether it leads anywhere.

⚠️ **that is a real argument and it is why this is 85% rather than 95%.** the honest rebuttal is that
the rut test asks *"does the found path work?"* — and 97 value reads with no cardinality mark are
legible, greppable, and have caused no measured defect. the rut warns against conformity **with no
test**; a test was run here, and it is in the table above.

## .rework, and why CLEAN

one rename in two files: the export in `getNearMissGuardKey.ts` and its one import in
`parseStoneGuard.ts`. **no contract crosses a repo boundary** — the operation is private to the
guard parser and is not re-exported.

## .confidence — 85%

| certain | not |
|---|---|
| the measurement: 122 exported, 25 conformant | whether the de-facto convention is a **convention** or an accumulated drift |
| the rule's text is unambiguous | whether a wisher weights a booted org rule above a local 80% pattern |
| the rework is two lines | whether the answer is *conform this one* or *sweep all 97* |

🔴 **the second row of column two is the live question, and it is not this route's to settle.** a
97-operation rename is a repo-wide act; a 2-operation one is this diff. **the fork is which of those
two the answer is**, and either way this feature's file changes by two lines.

## .where

- `src/domain.operations/route/guard/getNearMissGuardKey.ts` — the export
- `src/domain.operations/route/guard/parseStoneGuard.ts` — the one import
- `rule.require.get-set-gen-verbs` (`ehmpathy/role=mechanic`) — the rule, and its BLOCKER line

## .the verdict, once ruled

*(open)* — ⚠️ **and whichever way it goes, the 97 deserve a record.** a booted BLOCKER rule at 20%
compliance is either a rule the repo should conform to or a rule whose scope needs amendment, and
today it is neither. ⇒ caught as `.dream/v2026_09_14.reseed.get-cardinality-is-20-percent-adopted.md`.
