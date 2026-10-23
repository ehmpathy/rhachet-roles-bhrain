# F217 — the cache-seam row table stays a boolean until a `partly` value is ruled

## .the fork

i042 r031 nitpick.1 asked `IS_CACHEABLE_SECTION` (the coarse rows) derived from `IS_CACHEABLE`
(the fine inputs) through `SECTION_OF_INPUT`, so one table is the source and none can drift.

a derivation must say what a row is when its fine inputs disagree. the reviewer named it: such
a row is "partly". today the table is `Record<row, boolean>`, and it is PUBLISHED: `rhx
review._.cost --json` emits it as `seam`, and the acceptance suite asserts the payload equals it.

1. **derive, with a `partly` value** — the row type widens to `true | false | 'partly'`; the
   `--json` `seam` contract changes, and every reader of the table (`asPromptSectionRows`,
   `getOneCharsByCacheSeam`, the cost CLI) must decide where a `partly` row sums
2. **derive, collapse disagreement to one side** — keeps the type, but hides the very case the
   reviewer wants explicit
3. **keep both tables, clamped** — `getOnePromptSectionCharsFromCompiled.test.ts [case1d]` fails
   the moment a fine input and its row disagree

## .taken

option 3, disputed. the vocabulary half of the same lane (nitpick.2) was repaired this round:
the row schema and its tables now live in `PromptSectionChars.ts`, apart from the parser.

## .rework — dirty

option 1 changes a published `--json` field and the cache-seam sum at three readers. a `partly`
row must be ruled on: does it count toward the "most any cache could serve" bound, or not?

## .confidence — 75%, and why it is not higher

the clamp catches drift at test time, not at the type check, which is the reviewer's point.
the 25% is that a seam change is rare but real (`targetFiles` flipped once, 2026-10-01).

## .where

- `src/domain.operations/review/PromptSectionChars.ts` — `IS_CACHEABLE_SECTION`
- `src/domain.operations/review/getOnePromptComposition.ts` — `IS_CACHEABLE`
- `src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled.test.ts [case1d]`

## .verdict

open — for the council.
