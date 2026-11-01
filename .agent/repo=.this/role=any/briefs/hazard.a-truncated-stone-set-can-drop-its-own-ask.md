# hazard: a truncated `route.stone.set` can drop its own ask

> **never pipe `rhx route.stone.set` into `head`. the pipe can close before the skill records the next ask, and the next promise is refused with `🍃 no ask on record`.**

## .the shape

```sh
👎  rhx route.stone.set --stone 1.vision --as promised --that a --into … | head -20
👍  rhx route.stone.set --stone 1.vision --as promised --that a --into …
```

a promise does two things: it records the promise, then it asks for the next review and prints that ask. `head` exits once it has its lines, and the skill takes a SIGPIPE on its next write. the screen shows `review.self N/5`, yet the ask behind it may never land.

## .the tell

| what you see | what happened |
|---|---|
| the prior output named `review.self N/5`, and the next promise says `no ask on record` | the ask was printed but not recorded |
| no artifact was edited between the two | rules out the usual cause: an artifact edit that rewinds the ask |

## .the repair

run `rhx route.stone.set --stone <s> --as passed` (unpiped) to re-ask. the guard hands back the same slug and path. then let the dwell pass before you promise: the review file now predates the ask.

first seen 2026-11-01, `rhachet-roles-bhrain` route `v2026_11_01.fix-memory-guard-fails-open`, `1.vision` review 3→4. a hypothesis from one occurrence plus the absence of an artifact edit; the source of `stepRouteStoneSet` is the test that would confirm it.
