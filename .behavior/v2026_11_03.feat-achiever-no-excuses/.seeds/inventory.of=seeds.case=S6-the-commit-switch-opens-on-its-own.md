# S6 — the commit switch opens on its own

## .said

> drop the ask to lift the global switch: no one asks for it. it opens on its own at 20:00 CT (02:00Z) tonight. until then, keep the stone held; at 02:00Z commit, push, open the pr and --watch to green. the radioTaskHeld stop-hook error is a known stale hook on this grove, and it is with its owner; ignore it.

## .settled

- the global commit block is never asked to be lifted; it opens on its own at 02:00Z
- the blueprint stone stays held until then
- at 02:00Z: commit, push, open the pr, `--watch` until green
- the `radioTaskHeld` stop-hook error is a known stale hook with its owner; not this route's to cure

## .landed

- blocker artifact rewritten with no ask
- a session poll every 10 minutes that acts once the switch reads open
