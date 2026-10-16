# domain.term.choice.reason: meter

## .etymology

from the **utility meter** — the box on a house that reads what was drawn. the metaphor
carries three properties the surface needed, and each one settled a question:

| the property | what it settled |
|---|---|
| it reads; it does not decide | the instrument never sets a bound. `route.guard.budget` does |
| it reads what already flowed | the figure is realized, never projected (the `F3` deletion) |
| it can be broken, and a broken one is obvious | the `unknown` grade, and the `defect` field beside it |

that third property is the one a lesser word loses. a meter that cannot read says so; a
tracker or a monitor implies a figure is always available, and the absence of a figure
then reads as a nil.

so the word was chosen for the failure mode, never for the happy path.

## .the rejected peers

| rejected | why |
|---|---|
| **tracker** | implies a continuous watch. the instrument runs on demand, over a corpus at rest |
| **monitor** | same, plus it reads as an alarm — a monitor that finds no figure has found a problem, where an unpriceable run is an ordinary fact |
| **accountant** | an accountant reconciles. this instrument reconciles naught — it reads one artifact and states what it found |
| **gauge** | a gauge shows a level, so it always shows a value. there is no gauge position for "unmeasurable", which is the one verdict this instrument most needs |

`cost` is no rejected peer: it names the quantity this instrument reads, and both words are kept.
the dispute below argues the line between them.

## .disputes

### dispute: cost — raised 2026-09-21 — status: RESOLVED (both words, distinct concepts)

- raised.by  = the `repo-rules` peer lane, at i001
- claim      = `meter` composes several declared dobjs/dops on this branch and had no glossary
               entry, so it is either a domain term owed itemization or a generic-english word
               that should collapse into `cost`
- counter    = it is not generic, and it does not collapse. the two words name an instrument
               and a quantity, and the distinction carries real weight: a run the instrument
               read and could not price is `unknown`, and that grade is the whole honesty claim
               of the surface. with one word there is no way to say "the reader worked, the
               figure did not" — which is precisely the misread `rule.forbid.failhide` names
- resolution = keep both. `meter` = the instrument, `cost` = the quantity. `tracker`,
               `monitor`, `accountant`, and `gauge` become forbidden synonyms of `meter`

### dispute: the breadth in the name — raised 2026-09-20 — status: RESOLVED (breadth is an axis)

- raised.by  = the wisher, mid-drive
- claim      = the command was `review.meter` for a tree and `review.fleet` for a grove, so the
               instrument's name and the corpus's name shared one slot
- counter    = the instrument does not change with the corpus. `getOneReviewRunMeter` reads one
               run identically whether it was reached by `--of run`, `--of tree`, or
               `--of grove`; only the set of dirs handed to it differs
- resolution = the breadth moves to a flag (`--of run|tree|grove`), and `meter` names the
               instrument alone. the command is `review._.cost`, because a human asks for the
               quantity — the instrument is how the answer is got, never what was asked for
               (`F1`)

## .evidence

the decomposition. the `1.vision.experience.dimensions.md` walk declares `breadth` with
three positions and `quantity` with two (`cost`, `chars`). `meter` appears on neither axis —
which is the proof it is an instrument rather than a coordinate. a word that named a cell of
that product would be a breadth or a quantity; this one is what reads a cell.

the failure that named it. the `unknown` grade was not designed up front. it arrived when a
rollup summed cost over metered runs, found none, and rendered `USD 0` — a measured nil for a
lane whose one run compiled a prompt and then died before it wrote metrics. the repair needed a
word for "the reader ran, the figure is absent", and `cost` alone could not carry it.

the acceptance clamp for exactly that: `reviewCost.acceptance.test.ts` `[case2][t0]`, "an
unknown lane renders its spend absent, never as $0.00".
