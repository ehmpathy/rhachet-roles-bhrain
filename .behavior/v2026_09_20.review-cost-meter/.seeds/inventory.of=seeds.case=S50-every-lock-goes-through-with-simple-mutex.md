# seed S50 — every lock goes through with-simple-mutex

archived verbatim, before distillation. a correction that arrived as a question, then a
directive: the driver had built three hand-rolled locks (a guard round mark, a warmer claim, a
prime claim) on raw `fs` writes and never looked for the org's own lock primitive.

## .said

> why do you have custom locks instead of use of with-simple-mutex

> enrule that all locks must go through with-simple-mutex

> explain what it cant support yet? and why its needed?

> why does rewind get a lock?

> why does the warmer need one too?

> cant those just track the last time they ran, highwatermark, and only lock the short duration they update the watermark on?

> seems like a long mutex is an antipattern to begin with

> add these lessons to the with-simple-mutex rule; that if you cant use with-simple-mutex, then you probably overcomplicated it and have an antipattern

> and dispatch that rule upstream still into rhachet-roles-ehmpathy architect

## .settled

- a lock is mutual exclusion over a key. the org owns one primitive for it, `with-simple-mutex`,
  whose isolation scope (process, machine, global) is a choice of cache, not a new mechanism
- a hand-rolled lock — an `openSync(..., 'wx')` claim, a pid file, a lock file whose name
  carries a holder — re-derives that primitive without its atomic conditional write, its lease
  expiry, or its typed errors, and each one invents its own crash rule
- so every lock goes through `with-simple-mutex`. a lock need that seems to exceed it signals an
  overcomplicated design, never a gap in the package
- a long mutex is itself the antipattern: a hold spans one state transition — the read-check-write
  of a watermark or generation — and never the work that state describes. "is this work in
  flight?" is answered by state, not by a held key
- with every hold that short, the lease is seconds, so a crashed holder frees its key at once and
  no renewal, held-check, or hand-off feature is owed upstream
- the rule rides upstream to the ehmpathy architect role, since it is a design law, not a
  repo-local one

## .landed in

- `.agent/repo=.this/role=any/briefs/rule.require.locks-via-with-simple-mutex.md`
- `.agent/repo=.this/role=any/briefs/rule.forbid.hand-rolled-locks.md`
- a radio task into `ehmpathy/rhachet-roles-ehmpathy` for the architect role
- the migration of the round mark, the warmer claim, and the prime claim
