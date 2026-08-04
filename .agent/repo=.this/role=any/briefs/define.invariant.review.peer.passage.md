# define.invariant.review.peer.passage

## .what

a stone cannot pass until **every** peer-review guard, at **every** level, is terminal. a
terminal *prior* level does not clear a *later* one — to unlock the next level is not to clear it.

## .invariant

```
PASS ⟺ every peer-review guard is terminal
```

terminal = `approved | exhausted | malfunction | constraint | overruled` (see the `terminal`
glossary term). any reviewer still `queued | ready | rejected` (non-terminal) is a hard blocker,
never a silent zero.

## .why

the ladder *orders* execution — a dearer higher level runs only once the cheaper lower level is
terminal — but the **order is not the gate**. all-reviewers-terminal is the gate. a level that is
terminal-for-unlock lets the next level run; it does not pass the stone past that next level.

> wisher, 2026-07-24: "you can't pass a stone until all the peer review guards are terminal … all
> reviewers must be terminal before a stone can be moved past, regardless of whether a prior level
> is terminal." — the core invariant.

## .terminal is necessary, not sufficient

terminal gates passage; it does not grant it. once **all** guards are terminal, a per-verdict
consequence still applies — and `approved` is the **only** verdict a driver can pass on alone:

| terminal verdict | required act before passage |
|---|---|
| `approved` | none — clears autonomously |
| `exhausted` | human `--as approved` |
| `malfunction` | human `--as overruled` |
| `constraint` | human `--as overruled` |
| `overruled` | already forgiven (a human act put it there) |

so every non-`approved` terminal demands a deliberate, attributable human act before the stone
moves.

## .the trap this guards

`terminal` reads at two scopes — **terminal-for-unlock** (lets the next level run) vs
**clear-for-passage** (approved-or-overruled). the two must never be conflated: a prior level that
is terminal-for-unlock does not make a later level clear-for-passage. the extant code already
models this split (`computeReviewLevels.ts`: `isReviewLevelClearForPassage` vs
`isReviewPeerLevelTerminal`).

## .detection

the passage decision must reason over the **level ladder state** (which levels are unlocked and
whether each is clear-for-passage), not over a file-based tally of present review artifacts. a
file-centric tally is structurally blind to an unlocked level that *should* have a verdict but has
produced no file — that blind spot is exactly how an overruled/exhausted lower level let a ready
higher level be skipped.

## .enforcement

- a stone that passes while any unlocked peer-review level is non-terminal = **defect**.
- a passage decision that tallies present review *files* rather than unlocked *levels* = **defect**.

## .see also

- `domain.terms/term=terminal._.choice._.md` — the term this invariant is built on.
- `define.invariant.review.peer.exhausted.md` — the companion per-verdict invariant (exhausted ⟺ skipped).
- `define.passage-statuses.md` — only `passed` constitutes valid passage.
