# F21 — the diverge statement refusal is held where main held it, not cured here

## .the fork

`stepDiverge`'s contract says a seed "must be phrased as a question" and a seed that is not
yields `BadRequestError: input must be a question`. the refusal lives only in the prompt. with
F19's skip lifted, ci ran the case under `when.repeatably(REPEATABLY_CONFIG)` and the brain
answered the statement seed in all three attempts. either cure the product here, or hold the one
case and defer the cure.

## .taken, and why

held: `when.skip` on that one case, its note names the defect and the dream. every other thinker
case runs, under the repeatable form, and passed on ci.

the cure is a check of the seed's form in code before the brain is called. every seam for it
changes what thinker's callers receive, or reads the seed back out of a rendered prompt:

| seam | why it is not clean |
|---|---|
| a guard step that throws `BadRequestError` | callers (`loopDiverge`) get an exception where they now get artifact text |
| `genStitchChoice` around the brain step | unused in this repo; it forks to its options, so the brain may still run |
| the `imagine` function | it receives only the rendered prompt; the seed would be parsed back out of it |

and the same prompt-only refusal sits in triage, cluster, and demonstrate. so the cure spans four
steps and their templates, in a pr whose scope is the boot budgets.

## .rework — dirty

the cure changes thinker product behavior across four steps. the hold itself is one line to lift
once the cure lands.

## .confidence — 70%, and why it is not higher

a skip is what 5.3 asks to remove. this one is honest where main's was not (it names the defect,
not a lapsed quota), but a council may rule that the product cure belongs in this pr.

## .where

`src/domain.roles/thinker/skills/khue.diverge/stepDiverge.integration.test.ts` ·
`.dream/v2026_10_23.fix.thinker-guards-ask-the-brain-to-refuse.md`

## .verdict

open — for the council.
