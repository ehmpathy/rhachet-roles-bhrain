# hazard: a promise can print the next ask and not record it

> **the `review.self N/M` a promise prints is not proof its ask is on record. when the next promise meets `🍃 no ask on record`, re-ask with `--as passed`, then let the dwell pass.**

## .the shape

a promise records itself, then hands off to `setStoneAsPassed`, which mints the next slug's ask (`.since`, `sinceOnly`) and prints it. the mint runs inside `setRoundOutput`, which lands a write only while the round's rewind generation holds. if the generation moves between the round's start and the mint, the write is dropped and the printed ask has no marker behind it.

## .the tell

| what you see | what happened |
|---|---|
| the prior output named `review.self N/M`, and the next promise says `no ask on record` | the ask was printed, not recorded |
| `.route/<stone>.guard.selfreview.<slug>.triggered.since` is absent | confirms it |

## .the repair

```sh
rhx route.stone.set --stone <s> --as passed     # re-ask; the guard hands back the same slug and path
```

then let the dwell pass before you promise: the review file now predates the ask. an edit to the review file after the re-ask is fair, and often the honest move — the wait is time to deepen it.

## .what it is not

🟡 **not the pipe.** the first occurrence was piped into `head`, and that was read as the cause. a second occurrence, unpiped, refutes it. never pipe `route.stone.set` anyway — a truncated stdout hides the ask's path — but do not expect the unpiped form to prevent this.

## .open

what moves the generation between a promise and its mint is not yet named. candidates: the reminder daemon on the same route, or a concurrent `route.stone.set`. the clamp would be a stepRouteStoneSet test that bumps the generation mid-round and asserts the next promise still finds its ask.

first seen 2026-11-01, `rhachet-roles-bhrain` route `v2026_11_01.fix-memory-guard-fails-open`: `1.vision` review 3→4 (piped), then `5.1.execution.from_vision` review 1→2 (unpiped).
