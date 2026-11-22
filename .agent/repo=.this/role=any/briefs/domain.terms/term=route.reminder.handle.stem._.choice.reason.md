# domain.term.choice.reason: stem

## .etymology
`stem` = the shared part to which endings attach, as a word stem takes suffixes. the handle's
extensions (`.pid`, `.log`, `.crashes`, `.focus`) attach to one stem.

rejected:
- `basename` — a basename includes the extension; the stem excludes it
- `prefix` — reads as a string-prefix match, which the sweep never does; it builds exact paths

## .disputes
none.

## .evidence
- the clone handle (`getRouteReminderHandlePath`) and the legacy sweep (`delRouteReminderLegacyHandles`)
  both build paths from `asRouteReminderHandleStem`, so the two cannot name one clone two ways
- invariant: one stem per clone address; two clones never share a stem
