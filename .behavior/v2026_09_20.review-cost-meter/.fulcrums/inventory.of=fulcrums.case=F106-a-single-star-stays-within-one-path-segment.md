# F106 — a single star stays within one path segment

## .the fork

`isPathMatchedByGlob` serves `--paths-wout`, the polluter exemption, and `--partition`. it
cast `*` to `.*` and left `.` unescaped, so `src/review/*` claimed every file beneath
`src/review/`, and `blackbox/review.*` matched `blackbox/reviewX…`. two partitions could not
be drawn disjoint: each one-segment glob claimed a whole subtree, and every file went common.

- (a) standard glob semantics everywhere: `*` and `?` within one segment, `**` across
  segments, `**/` for zero or more dirs, every other char literal. a slash-free pattern
  tests the basename, as `.gitignore` does, so `*.test.ts` keeps its any-depth sense
- (b) standard semantics for `--partition` only; leave `--paths-wout` and the polluter
  exemption on the old loose matcher
- (c) leave the matcher; write partitions with explicit prefixes only

## .taken — (a), and why at the time

- `--paths-with` selects through a real glob library, where `*` stops at a `/`. one pattern
  read two ways by flag is the ambiguity `rule.forbid.domain-term-ambiguity` forbids
- (b) keeps two matchers that drift; (c) hides the defect from every caller who types a glob
- a scan of every `.guard` and `src` file found no `--paths-wout` glob that leans on `*`
  across a `/`; the one slash-free form in use (`*.ts`) keeps its sense through the
  basename rule

## .rework — clean

one transformer and its caselist. callers pass globs through unchanged.

## .confidence — 85%

the residual risk is a guard in another repo that wrote `dir/*` and meant `dir/**`. it would
now exclude less, never more — a lane reviews a file it once skipped, which fails loud in the
review, never silent.

## .where

`src/domain.operations/review/isPathMatchedByGlob.ts` · its `.test.ts` (six new clamps, each
red under the old matcher)

## .verdict

— (awaits the council)
