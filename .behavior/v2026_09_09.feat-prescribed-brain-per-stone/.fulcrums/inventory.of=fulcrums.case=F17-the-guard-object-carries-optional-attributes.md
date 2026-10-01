# F17 — `brain?: string` is optional, where the rule asks for `string | null`

**rework** = dirty · **status** = open · **confidence** = 75%

🟡 the field is now `brain?: RouteStoneGuardBrain` (`RouteStoneGuard.ts:198`); the fork is unchanged.

## .the fork

| the shape | what it says |
|---|---|
| **taken** — `brain?: string` | a guard may omit the key — the idiom `reviews.self?` / `reviews.peer?` already use |
| `brain: string \| null` | every guard answers; `null` means the driver keeps its inherited brain |

`rule.forbid.undefined-attributes` (mechanic) grades the optional a blocker. the object already
carries two optionals, so the fork is which consistency wins when a booted rule and its file disagree.

## .taken, and why

`brain?: string`, by local imitation before the rule was consulted. it stands for the ripple below.

## .rework — dirty, measured

the peer shape on `brain` alone: `rhx git.repo.test --what types` → **54 errors across 7 files** —
1 production (`parseStoneGuard.ts`), 53 test literals in six suites this feature never opened
(`runStoneGuardReviews` 34, `runStoneGuardJudges` 13, `delStone` 2, three others 1 each). a full
conform moves `self?` / `peer?` too.

## .confidence — 75%

| certain | not |
|---|---|
| `?` diverges from the rule | whether a parsed config shape is what the rule aims at |
| the ripple is 54 errors | whether `self?` / `peer?` are judged exemptions or drift — no record says |

⇒ an undocumented divergence from a booted blocker is re-argued by every feature that adds a field.

## .where

- `src/domain.objects/Driver/RouteStoneGuard.ts` — the two prior optionals and `brain?: string`
- `.dream/v2026_09_14.fix.the-guard-object-carries-optional-attributes.md`

## .the verdict

open.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F17-the-guard-object-carries-optional-attributes.md`
