# F86 — the re-parse census keeps `scaffold` as a graded residual this round

- rework = 🟠 **dirty** — two new census rows (`instructions`, `outputFormat`) reach the compiled record, the meter, the grove, `--json`, and every snapshot that renders a section row
- confidence = 🟡 **60%** (was 70% — its published-contract premise was false pre-merge; see `.the ripple`)
- raised.by = `repo-rules-review-ops` at i057, nitpick.3

## .the fork

`asPromptSectionChars` re-parses a prompt read off disk. it sums the five delimited rows and
defines `scaffold = prompt.length - delimited`. `rule.require.distinguish-every-review-input` names
a residual `scaffold` as its own failure mode: a new block whose tag is not in `TAG_OF_SECTION`
lands in `scaffold`, and the sum still holds.

| option | what it costs |
|---|---|
| A — cut `instructions` and `outputFormat` out of the head as named rows, so `scaffold` holds only markup | two new rows in the census type, the compiled-record schema, the meter and grove renders, `--json`, and every snapshot that prints a section row |
| B — keep the residual, graded by `getOneAttributionOfScaffold`, and defer A to a dream | a block with no row still reads as markup until the dream lands; the grade flags a residual past its bound |

## .taken — B

- the re-parse is the coarse projection for runs whose compiled record predates the composition.
  a run that carries `prompt.composition` is attributed by `getOnePromptComposition`, which names
  every input, so the residual governs only the older on-disk corpus
- the residual is not silent: `getOneAttributionOfScaffold` grades it, and the render says
  `unattributed` where it outgrows markup, so an unmapped block reads as a gap, never as overhead
- A opens a second fork — whether the compiled record splits the same two rows — and the
  snapshots of three surfaces ride on that call (`rule.always.fix-forward-under-scouts-honor` —
  safe, not clean)
- the work is caught: `dreams/v2026_10_03.refactor.reparse-census-names-instructions-and-output-format.md`

## .the ripple, measured

a peer lane argued every file A touches ships in this PR, so the dirt fits the diff. the files
do; the contract does not. A adds two keys to `PromptSectionChars`, and that key set is a
PUBLISHED shape:

- `rhx review._.cost --json` emits `sections` and `cacheable` keyed by it — pinned in
  `reviewCost.acceptance.test.ts.snap` and `reviewCostViaRhx.acceptance.test.ts.snap`
- `Record<keyof PromptSectionChars, …>` tables that must each gain two rows:
  `IS_CACHEABLE_SECTION`, `RANK_OF_SECTION`, `SECTION_OF_INPUT`, `SECTION_OF_LEGACY_INPUT`
- readers of the key set: 11 source files (`asPromptSectionRows`, `asPromptInputsCensus`,
  `getOneCharsByCacheSeam`, `getOnePromptSectionCharsFromCompiled`, `getOneReviewRunMeter`, …)
- section-row snapshots: run, meter, grove, input, overflow-refusal, and two acceptance suites —
  70 pinned `scaffold` lines across 9 snapshot files
- the compiled lane already folds `instructions` and `outputFormat` into `scaffold` by
  `SECTION_OF_INPUT`, so A must also decide whether the COMPILED record splits them, or the two
  lanes disagree on the key set — a second fork A opens rather than closes

🔴 **corrected 2026-10-05: the `--json` shape is NOT yet published.** neither
`src/contract/cli/review._.cost.ts` nor `asPromptSectionChars.ts` exists on `origin/main`
(`git ls-tree origin/main` returns naught for both), so no consumer reads the key set until this
PR merges. the argument above that leaned on a published contract does not hold, and is struck.

⇒ what remains of the CLEAN answer is the second fork, not the file count: A must decide whether
the COMPILED record splits `instructions` and `outputFormat` too. if it does, every run already
written to disk carries the old key set, so the meter reads two shapes of one record; if it does
not, the two lanes disagree on the key set the same report renders side by side. that is a schema
decision for a council, and it is why B still stands — at lower confidence.

## .why confidence is not higher

the rule quotes this exact shape as its failure mode, and a grade on a residual is a detector, not
a cure. a reader may hold that the rule binds the re-parse as firmly as the composition, and that
the older corpus is reason enough to cut it now.

## .verdict

🟡 BEST-GUESSED 2026-10-03 — defer to the dream.

- 2026-10-07 — re-raised at i013 (`68dd6daa0d37eeb7d2`) by `r015.repo-rules-review-ops` with a new
  counter: the grade fires `unattributed` only past BOTH floors (`>= 10%` and `>= 2,000` chars), so a
  small unmapped block (~500 chars in a 200k prompt) still lands in `scaffold` in silence. the lane
  grants that the head rows now land (`instructions`, `outputFormat` cut by `getOneHeadRows`), so
  option A's split is in; what remains is the residual row itself. answered in the i013 `.taken`:
  - the re-parse runs only where a run carries no compiled record — `getOneReviewRunMeter` returns
    the compiled lane first and reaches `asPromptSectionChars` only after it reads null. every run
    this compiler writes carries `compiled.inputs`, attributed by `getOnePromptComposition` with no
    residual. so a NEW unmapped block cannot reach the re-parse: a block is new only in a new
    compiler, and a new compiler writes the compiled record
  - the corpus the re-parse governs is FROZEN — runs written before the composition existed. their
    block set is the historical one, and every delimited tag those compilers emitted is in
    `TAG_OF_SECTION`. an unknown tag there would be a compiler nobody shipped
  - and the residual is never hidden: `scaffold` renders its own chars on every surface, so a 500-char
    excess reads as 500 chars of scaffold, beside a markup size a reader can compare it to. the floors
    exist because markup varies with target count; a floor that scaled to zero would flag every run
  still disputed, for the council.
- 2026-10-07 — re-raised at i016 (`31f2ba409ea651c2e8`) by `r015.repo-rules-review-ops` as blocker.1:
  the residual ROW still absorbs an unknown-tag block, and the under-count side has no guard.
  **repaired, not disputed.** the reader now hunts every inter-block gap for a tag no known compiler
  emits (`TAGS_OF_GAP_MARKUP` — the `<target>` wrapper plus the scanned block tags) and grades the
  census `unattributed` outright where it finds one, whatever its mass (`asAttributionOfResidual`).
  a small unmapped block can no longer sit under the mass floor in silence. clamped by
  `asPromptSectionChars.test.ts` `[case14] [t6]` (a 1-char `<skills>` block, under every floor).
  the `scaffold` row stays a residual — the rows must still sum to the prompt — but it no longer
  vouches for what it absorbed. what remains reserved here is only the option-A schema call (a
  named row per markup kind), which this repair no longer needs to close the absorption.
