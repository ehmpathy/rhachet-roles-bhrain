# F2: the driver hooks stay a dream

## .the fork

the driver's own hooks call `rhx` the same way the old memory.guard did, so a lookup fault there exits 2 and blocks too. fix them in this pr, or leave them to their own?

- **fix here** — one pr closes the whole class.
- **dream + fulcrum** — this pr closes the memory.guard; the driver hooks get their own route.

## .taken: dream + fulcrum

- the wish names one guard: memory.guard. its done-means lists six clamps, all on that guard.
- the driver hooks are a different role, a different hook set, and a different blast radius: each hook gates a route act, and some MUST block (the mutate guard). a blanket fail-open there is a design question, not a copy of this fix.
- that question needs its own vision: which driver hooks are safety gates (fail closed is right) and which are advisory (fail open is right). this pr cannot answer it without a scope the wisher never asked for.
- the dream holds the shape of the fix: `.dream/v2026_11_01.fix.driver-hooks-fail-closed-via-rhx-exit-2.md`.

## .rework: dirty

to pull it in means a second vision (gate vs advisory per hook), clamps per driver hook, and a review of every route act those hooks guard. callers of the route would see changed block behavior.

## .confidence: 95%

the scope line is the wish's own, and the director confirmed it.

## .where

`1.vision.yield.md` `.open questions & assumptions`; the dream above.

## .verdict

ruled 2026-11-01 by the director at the `1.vision` approval: the driver-hooks dream stays a dream.
