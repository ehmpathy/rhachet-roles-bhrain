# rule.forbid.adhoc-scope-rollups

> **never hand-roll a rollup of a review's scope. read the one the tool already wrote — and if
> it did not write the one you need, cure the tool, then read it.**

a **scope rollup** = any count, size, or share of a review's targets by directory, kind, or file —
the answer to *"what fills this prompt?"*

the specialization of `rule.require.report-both-cost-levers-with-trend-and-locus` (its strongest
cue: *"you hand-write a rollup to answer a reader → that rollup is owed by the tool"*) for the moment
its readers look past it: a reviewer **overflowed**, and the driver must decide what to cut.

## .why — a hand-rolled rollup answers a different question than the prompt asked

| the hand-rolled rollup | the tool's rollup |
|---|---|
| reads raw `git` output | reads the targets AFTER the polluter filter, the bind globs, and the join |
| counts bytes on disk | counts the bytes the renderer SENDS (a diff, a body, or both) |
| ranks files the prompt never held | ranks only what the prompt held |
| lives in `.temp/`, dies with the round | ships to every future driver |

⇒ **it is wrong AND it is lost.** measured 2026-10-03: a hand census ranked `passage.jsonl` (169k)
as the heaviest file of an overflowed scope. the polluter filter had already dropped it; the run's
own `tokens.expected.md` never held it.

## .where the paved rollups live

| the question | the paved surface |
|---|---|
| a reviewer overflowed — what filled it? | the refusal's `locus:` block, on stderr |
| a reviewer overflowed — which lever fits? | the refusal's `lever` branch — bind cut for edited mass, a declared partition for added mass |
| per file, per directory, tokens | `$logDir/tokens.expected.md` (written before the overflow gate) |
| what each flag matched | `$logDir/input.scope.debug.json` |
| a run that completed | `rhx review._.cost --of run` |
| a tree or a grove | `rhx review._.cost --of tree` · `--of grove` |

| when… | then… |
|---|---|
| you are about to write code that walks `git diff` / `git status` to size a review | 🔴 stop. the run already sized it |
| a paved surface lacks the cut you need | **cure the tool** — add the cut to the paved render, with a test. never a `.temp/` file |
| you would cite a scope figure in a yield, a fulcrum, or a reply | cite the paved artifact by path |

blocker: a scope rollup computed outside the review tool's own artifacts and renders · a `.temp/`
file that sizes a review scope · a scope figure cited with no paved artifact behind it.

⇒ see also: `rule.require.report-both-cost-levers-with-trend-and-locus` (the parent) ·
`rule.always.reuse-pavement-before-improvise` (bhrain/role=learner) ·
`rule.always.diagnose-reviewer-malfunctions` (bhrain/role=driver — the overflow remedy is a guard
edit, read off the paved locus) · `asTargetLocusLines` (the one locus render).
