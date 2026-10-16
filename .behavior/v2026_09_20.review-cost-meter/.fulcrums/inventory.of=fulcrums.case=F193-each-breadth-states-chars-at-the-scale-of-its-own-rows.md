# F193 — each breadth states chars at the scale of its own rows

- raised 2026-10-09, from i032 r028 nitpick.2 `[nitpick][better]`: `--of run` prints `100.0k chars`
  and `--of tree` prints `100,000 chars` for the same bytes
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it if you want one format everywhere**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — one format at every breadth** | the same quantity reads the same way wherever a reader meets it |
| **B — each surface keeps one format across its own rows** | a reader compares figures within one page far more often than across two commands |

## .taken, and why

**B**, and it is already the declared design, not a drift:

- `asTargetLocusLines` takes its formatter as `figure`, and the jsdoc on that field states the
  rule: `asFigureHuman` (scaled) on the run and the refusal, `asCountHuman` (full separators)
  inside the census block the tree and grove share, *so the locus reads at the same scale as the
  rows above it*
- `asTargetLocusLines.test.ts` `[case3]` pins the census form

so within each page every chars figure shares one scale. to pick A would make either the run's
locus disagree with the run's token rows (scaled) or the census locus disagree with the census rows
(exact). the point the reviewer names is real across pages and absent within one.

## .rework, and why

**clean.** the formatter is injected at three call sites; a switch is one argument per site plus a
resnap of the cost snapshots at the breadths it touches. no contract, no caller, no stored shape.

## .confidence, and why it is not higher

a reader who pastes a run figure beside a tree figure does pay a mental conversion. if that is the
common read, A wins, and the change is cheap.

## .where

`src/domain.operations/review/meter/asTargetLocusLines.ts` (`figure`) ·
`genReviewRunStdout.ts` · `asPromptInputsCensusLines.ts` · `asTargetLocusLinesByInput.ts`

## .verdict

(open)
