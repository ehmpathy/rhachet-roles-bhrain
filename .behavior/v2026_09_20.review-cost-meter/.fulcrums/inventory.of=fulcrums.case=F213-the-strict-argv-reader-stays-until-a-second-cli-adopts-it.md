# F213 — the strict argv reader stays in `review._.cost` until a second cli adopts it

- raised 2026-10-10, from i039 r030 nitpick.2 `[nitpick][better]`: `review._.cost.ts` hand-rolls a
  strict argv reader (unknown, stray, repeated, and valueless flags each refused), and the reviewer
  asks it lifted into `domain.operations/cli/` so `review.ts` and `review.by.ts` share one grammar
- rework: dirty
- status: 🟡 **BEST-GUESSED — disputed, dream caught**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — lift the reader now** | one grammar in `domain.operations/cli/`; the contract declares its flags and shrinks by half |
| **B — keep it, catch the unify as a dream** | the reader has one consumer today, so a lift alone moves code and shares naught; the share comes only when `review.ts` and `review.by.ts` adopt it |

## .taken, and why

**B.** a lift buys its value only at the second consumer (`rule.prefer.most-common-denominator`:
nest at the leaf, lift on proven reuse — a lift with zero reuses is itself the nitpick). the second
consumers the reviewer names are `review.ts` and `review.by.ts`, and each has its own refusal
surface pinned by acceptance snapshots. to adopt the strict grammar there changes what a typo'd
flag prints on two published clis — every guard lane spawns `rhx review` — which is a contract
change, out of the cost-meter's scope, and dirty to pull in.

the reviewer graded it `better` and named no shipped harm; the drift it fears (a parse fix that
reaches one cli and not the others) is real only once two clis read the same grammar.

## .rework, and why

**dirty.** the move itself is clean, but the move with no adopter is speculative, and the adopter
half rewrites two published refusal surfaces and their snapshots.

## .confidence, and why it is not higher

`review._.cost` already folded the same refusal shape three times in its own file (`:636`,
`:1042`), which is a hint the grammar wants a home sooner than a second cli asks for one.

## .where

`src/contract/cli/review._.cost.ts` (`getOneFlagRead`, `getAllArgsStray`, `getAllFlagsRepeated`,
`getAllFlagsUnknown`, `isFlagSet`) · `src/domain.operations/cli/asCliOptionsOfArgs.ts` (the extant
lenient reader) · the dream: `dreams/v2026_10_10.followup.one-strict-argv-grammar-for-review-clis.md`

## .verdict

(open)
