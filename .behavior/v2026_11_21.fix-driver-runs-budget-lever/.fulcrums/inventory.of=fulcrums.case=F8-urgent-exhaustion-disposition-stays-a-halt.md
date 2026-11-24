# fulcrum F8: the urgent exhaustion disposition stays a halt; the push is a dream

## .the fork

- **A — render only**: this pr moves the owner line on every urgent halt render to the driver. the
  route's wait state for an urgent exhaustion stays `halt(exhausted)`: the status line reads "a
  human must approve or extend", and the reminder daemon stops
- **B — render and disposition**: also map an urgent exhaustion to a driver push, as a `better`
  one already is, so the status line and the reminder daemon name the driver's grant

## .taken: A

- the wish names the render and the briefs. the disposition is a separate surface with its own
  readers: the status line, the onStop hook, and the reminder daemon
- B moves `isRouteGuardConcessionExhaustion` (disjoint marks by construction), the status-line
  help text, and the reminder liveness rule. each has acceptance pins, and none of them can be
  proven locally (keyrack lacks the llm keys)
- a driver that reads the halt render, which is what a driver reads, now acts. the cost of A is
  time, never a shipped harm

## .rework: clean

a new disposition branch for the urgent mark, a status-line text, and a reminder liveness case.
no caller is hardened against the current state; this pr adds no reader of it.

## .confidence: 75%, and why not higher

r010 (behavior-intent) reads the wish's intent as "no human round trip" in full, and the status
line is a surface a human reads. if the wisher wants the wait state moved in this pr, B is a
contained change, but one this host cannot verify.

## .where

- `src/domain.operations/route/drive/asRouteStoneDisposition.ts:49–53`
- `src/domain.operations/route/stones/setStoneAsPassed.ts:727–733`
- `asStatusLineHelp.ts:33` · `isReminderLiveForPassageStatus.ts:51`
- inventory row 23 · dream `v2026_11_21.fix.urgent-exhaustion-is-a-driver-push.md`

## .verdict

reversed to B in 5.1 i003. r010 showed A ships a behavioral harm, not only a delay: on an urgent
dry exhaustion the onStop hook let the session stop, so the driver never met the halt that names
its grant. the "cannot verify" premise fell too: the keyless replay runs every acceptance suite
whose snapshots pin these surfaces.

- `asRouteStoneDisposition` maps either concession mark to a push (malfunction still halts)
- `isRouteDriveExhaustionStopBlocked`: either concession kind blocks the stop
- `isReminderLiveForPassage`: an exhausted passage with either concession mark keeps the reminder live
- clamps: each of the three went red on sabotage and green on restore
