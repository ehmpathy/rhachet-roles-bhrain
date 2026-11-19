# F11: the runner stays a heredoc this round

## .the fork

about 35 lines of js in `memory.guard.sh` run the guard: the cause render, the fault map, the deadline, the outcome map. no type check, lint, or unit test reaches them; only the integration and acceptance runs do. move all but the bootstrap import into the cli module as a tested pure function now, or catch it as a dream?

## .taken: catch it as a dream

- the bootstrap import must stay in the heredoc, since only code outside the module can name a module that fails to load; so the heredoc never goes away, it only thins
- every branch the heredoc holds is reached by an integration or acceptance row (load fault, load defect, guard fault, nudge, deadline), so a regression there goes red today
- the move is a second contract between the skill and the module, in a round whose wish is a fail-open fix; the dream carries its shape

## .rework: clean

one new pure function in `src/contract/cli/memory.ts` (or a leaf beside it), its unit table, and a thinner heredoc that imports it.

## .confidence: 85%

the arch lane grades it a nitpick to cure when next touched; the risk is an edit to the heredoc before the lift that a type check would have caught.

## .where

`src/domain.roles/learner/skills/memory.guard.sh`.

## .verdict

open for the human.
