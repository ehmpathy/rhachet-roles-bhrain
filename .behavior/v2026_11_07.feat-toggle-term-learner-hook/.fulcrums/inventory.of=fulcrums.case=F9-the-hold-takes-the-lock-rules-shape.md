# F9 — the hold takes the lock rule's shape

## .the fork

- **A.** one on-disk cache per repo, memoized at module scope; a 30s lease over a hold of one read and one write
- **B.** the cache threaded through an injected context
- **C.** a lease that never expires, or one renewed while the logic runs

## .taken — A

`rule.require.locks-via-with-simple-mutex` dictates both halves: the cache is "constructed
**once** at module scope" (a cache built per call is no lock at all), and "a hold spans a state
transition, never a unit of work", whose lease is seconds, so a crash frees the key at once.

the memo only grows (a findsert by repo; a found instance is never replaced), so no reader races a
swap. B would have every caller build and pass the cache, which is the per-call cache the rule
forbids, moved one frame out. C is the long hold the rule names an antipattern: a crashed holder
would block rhachet's own writers until a human cleared the key. the hold here is one file read and
one small write, milliseconds long; 30s bounds a stalled holder, and the 2 min acquire outlasts any
live rhachet hold.

## .rework — clean

the bounds are two literals in `withTermsHookSettingsHold`.

## .confidence — 90%, why not higher

rhachet's own lease and wait bounds were read in its 1.51 source; they could change upstream (see F6).

## .where

`withTermsHookSettingsHold.ts`
