# domain.term.choice.reason: hold

## .etymology

`rule.require.locks-via-with-simple-mutex` speaks of a **hold** that spans a state transition — the
time a key is kept. the toggle's own operation adopts that word (`withTermsHookSettingsHold`), so
the domain term and the rule read alike.

rejected:
- **lock** — the class of mechanism, and the word the forbid rule aims at hand-rolled ones. to name
  the toggle's claim a lock invites the hand-rolled shape the rule forbids
- **lease** — one field of the hold, its crash bound, never the hold itself

## .boundary

`hold` also reads as the term hook's own effect — a stale stop is *held*. the two senses meet on
one surface, so the boundary `learn.terms.hook` keeps this one to the target's mutex, and the
cli renders the other as a stop that is held, never as a hold.

🟡 the two senses share the word, and they never meet in one contract name: the mutex sense lives
in operation names, the stop sense only in prose. a contract that names a held stop would split
them (`rule.forbid.domain-term-ambiguity`).

## .evidence

- `withTermsHookSettingsHold` and its key derivation, which mirrors rhachet's `withRepoMutex` key
  (Q8, settled in `5.1.execution.from_vision.yield.md`)
- integration case10 (a toggle waits out rhachet's hold) and case11 (the layout splits under it)
- invariant: a hold spans one read-modify-write; its worst case is milliseconds, so its lease lapses
  at once after a crash
