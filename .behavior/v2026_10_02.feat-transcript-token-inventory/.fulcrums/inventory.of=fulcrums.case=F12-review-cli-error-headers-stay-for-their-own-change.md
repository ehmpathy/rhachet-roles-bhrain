# F12 — the review CLIs' unqualified error headers and exit 1 stay for their own change

## .the fork

the mech-failhides reviewer (i003 r002) raised two points against `src/contract/cli/review.ts`
and `src/contract/cli/review.by.ts`:

- blocker.1 — their error headers open with a bare `error:` or a glyph alone (`✋ <message>`,
  `💥 rubric malfunctioned`), never `✋ ConstraintError:` / `💥 MalfunctionError:`
- nitpick.1 — `review.by` exits 1 for caller-fixable cases where the semantics say 2

this diff touches each file at ONE line: the `DEFAULT_BRAIN` constant. two choices:

- **A — fix both here**: requalify every header in both CLIs, move `review.by`'s constraints to
  exit 2, resnap every blackbox case that pins them
- **B — leave both for their own change**, already caught as a dream, and dispute the two points

## .taken — B, and why at the time

- the defect predates this route; this diff did not add, move, or reword any of those headers
- it is not clean. `origin/main` has since rewritten both files (`review.ts` alone differs by
  ~700 lines from this branch's base), so a fix here lands on code main no longer has, and
  conflicts at rebase
- the exit codes are a pinned contract: `review.by.ts` states the blackbox criteria fix every
  error case to exit 1, and several acceptance snapshots assert it. a change there is a
  contract change for every caller of `rhx review` / `review.by`, outside this wish's scope
- the work is already caught, with its shape of fix:
  `.dream/v2026_10_21.fix.cli-constraint-errors-print-an-unqualified-header.md` — lift
  `formatTokenSpendErrorTree` into a shared `src/infra/cli/` render, route every CLI catch
  through it, and settle the exit-code contract in that same change

## .rework — clean

if the council rules A, the change is the two CLI files plus their acceptance snapshots, on top
of main's current form of them, via the shared render the dream describes.

## .confidence — 80%, and why it is not higher

the qualified-header rule carries no carve-out for a pre-extant defect in a touched file, and
scouts-honor favors a fix on contact. the call rests on DIRT (main's rewrite, the pinned exit
contract), not on scope, and a reviewer may weigh that dirt lower than I did.

## .where

- `src/contract/cli/review.ts`
- `src/contract/cli/review.by.ts`
- `.dream/v2026_10_21.fix.cli-constraint-errors-print-an-unqualified-header.md`

## .verdict

open.
