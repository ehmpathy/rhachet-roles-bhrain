# domain.term: terminal

term.chosen   = terminal
term.kind     = adj
term.synonyms.forbidden:
- final
- done
- finished
- complete
- closed

## .what
a peer-review guard is **terminal** when its verdict has reached an end-state the driver cannot
change on its own: `approved | exhausted | malfunction | constraint` (plus human `overruled`). a
non-terminal verdict (`queued | ready | rejected`) can still move under driver action, so it is NOT
terminal.

`terminal` carries the **passage gate** — the core invariant: a stone cannot pass until **every**
peer-review guard is terminal. terminal is necessary, not sufficient: once all are terminal, the
per-verdict consequence applies (`approved` clears; `exhausted` needs human `--as approved`;
`malfunction`/`constraint` need human `--as overruled`; `overruled` is already forgiven).

it also has a narrower **unlock** sense: a level is terminal-for-unlock (lets the next level run)
once every guard at it is terminal. same word, one concept (a guard at its end-state) — the unlock
use and the passage-gate use read the same `isReviewPeerVerdictTerminal`.

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/review/peer/meter/isReviewPeerLevelTerminal.ts   # isReviewPeerVerdictTerminal / isReviewPeerLevelTerminal
- src/domain.operations/route/guard/review/peer/meter/isReviewPeerLevelUnlocked.ts   # a level unlocks when all lower are terminal
- src/domain.operations/route/guard/review/peer/meter/getReviewPeerLadderStatus.ts   # terminalLevels / allTerminal
- src/domain.operations/route/stones/setStoneAsPassed.ts                             # the passage gate reads terminality

## .reason
see the ref-level cluster beside this choice:
- `term=terminal._.choice.reason.md` — etymology + why `terminal`, not `final`/`done`/`complete`
