# F18 — the repo-local skills paved this round ship with it

## the fork

at i004, r11 flagged `transcript.outputs` and the `.sh` wrappers for `census.dreams`,
`census.minpeer`, and `census.tokens` as outside this change; only `brief.min.moveout` and
`census.cues` serve it.

| option | cost |
|---|---|
| drop them from this pr, to a later one | the next traveler re-derives each, or they sit unshipped in a worktree that is deleted after merge |
| keep them | the diff carries `.agent/repo=.this/role=any/skills/` files that do not touch a role boot |

## taken, and why at the time

keep. each was paved because the round hit the need twice (`rule.always.enskill-the-tactics-you-discover`):
`transcript.outputs` reads a tool result back from a session transcript where `jq` with a filter is
not paved; the three `.sh` wrappers make the extant `.js` skills resolvable by `rhx` at all, and
`census.minpeer` and `census.tokens` measured this route's budgets. they live in the repo-local
skills dir, ship to no consumer, and boot into no role.

## rework: clean

each is a self-contained file pair; a removal touches no caller.

## confidence: 75%, and why it is not higher

- a reviewer may hold that a skill paved mid-route belongs in its own pr, by scope alone
- `transcript.outputs` serves the driver's session tools, not the clamp

## where

`.agent/repo=.this/role=any/skills/` (`transcript.outputs.*`, `census.dreams.sh`, `census.minpeer.*`, `census.tokens.sh`)
