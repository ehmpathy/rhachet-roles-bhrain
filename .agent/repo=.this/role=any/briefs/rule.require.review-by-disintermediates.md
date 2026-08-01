# rule.require.review-by-disintermediates

## .what

when `review.by` runs with `--for <rubric>` — a **single review scope** — it MUST
**disintermediate**: emit the base `rhx review` stdout verbatim, NOT the review.by summary tree.

`--for` narrows the run to exactly one rubric, so review.by is a bare resolver around one
review. it prints what that review printed — the owl header, the metrics, the `summary` block —
and none of its own chrome. no `🔍 review.by` anchor, no `rubrics` bucket, no `r1 <slug> ✓` row.

an **aggregate** run — no `--for`, the whole review set — keeps the review.by tree: it composes
many reviews, so the tree is the value.

| invocation | scope | stdout shape |
|------------|-------|--------------|
| `review.by --role X --for <rubric>` | one review | the base review's stdout, verbatim |
| `review.by --role X` | the review set | the review.by summary tree |

## .why

the primary consumer of `review.by --for` is a **route guard peer review**. a guard runs a peer
`run:` command, captures its stdout, and tallies blockers/nitpicks off it (the `reviewed?`
mechanism). the guard then wraps that captured stdout into its OWN peer tree.

if review.by --for emitted its own tree, the guard would wrap review.by chrome (`r1 <slug> ✓`,
a `rubrics` bucket, a review.by summary) inside the guard tree — a tree within a tree, review
info doubled. disintermediation makes `review.by --role X --for <rubric>` a **drop-in for a
plain `rhx review`** in any guard peer slot: the guard wraps a normal review, exactly as it does
for a direct `$rhx review …` peer.

the guard-parseable summary survives: the base review's stdout already carries the `N blockers` /
`N nitpicks` lines (the reviewer-output contract), so a guard tallies off the disintermediated
stdout with no change.

## .the inner dispatch banner is stripped

review.by resolves a rubric via the base engine as a subprocess (`rhx review …`). the rhx harness
stamps every dispatch with a `🪨 run solid skill …skill=review` banner as the first stdout line,
so the captured base-review stdout OPENS with that inner banner.

to re-emit it verbatim would DOUBLE the banner under a guard: the guard dispatches the peer as
`rhx review.by …`, which the harness stamps `…skill=review.by`, and then the captured inner
`…skill=review` banner rides beneath it — two `🪨 run solid skill` lines where a direct review
peer shows one. the inner banner is a dispatch stamp for review.by's OWN subprocess, not part of
the review body, so review.by strips it before it disintermediates (`asReviewBodyStdout`).

the result: a guard-dispatched `review.by --for` shows exactly ONE banner — the honest
`…skill=review.by` stamp the guard's own dispatch produced — then the review body. that is the
same shape as a direct review peer (one banner + body); only the skill name in the banner differs,
which is truthful (the guard did dispatch review.by). a node-import invocation (no rhx stamp)
shows the body alone.

review.by never emits a dispatch banner of its own — a dispatch banner belongs to whoever
dispatched review.by, upstream and outside its control.

## .the exit code is unchanged

disintermediation changes only what is PRINTED, never the exit code. review.by still resolves the
rubric's verdict and exits by it — 2 (blockers), 1 (malfunction), 0 (clean). a guard reads both
the stdout (for the tally) and the exit code (for the outcome) exactly as it does for a direct
review peer.

## .the test

ask of a `review.by --for <rubric>` run:

- "is the stdout indistinguishable from a plain `rhx review` for that rubric's rules?" → must be
- "does it contain any review.by-only chrome (`🔍 review.by`, a `rubrics` bucket, `r{n} <slug>`)?"
  → must NOT

if either answer is wrong, review.by is intermediating where it must disintermediate.

## .see also

- `rule.require.review-by-wrapper-pattern` — the per-role wrapper that ships review.by
- `contract.reviewer-output.md` — the stdout contract the base review emits (the guard parses it)
- `howto.review-by.[guide].md` — the base-engine + per-role-wrapper architecture

## .enforcement

- a `review.by --for <rubric>` run that emits the review.by tree instead of the base review's
  stdout = **blocker**
- a `review.by` aggregate run (no `--for`) that does NOT emit the summary tree = **blocker**
- a guard peer that runs `review.by --for` and shows doubled review info (a review.by tree nested
  in the guard tree) = **blocker** (the disintermediation regressed)
- a `review.by --for` run that emits a DOUBLED `🪨 run solid skill` banner (the inner
  `…skill=review` dispatch stamp left un-stripped) = **blocker** (see `asReviewBodyStdout`)
