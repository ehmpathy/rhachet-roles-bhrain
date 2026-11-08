# domain.term.choice.reason: toggle

## .etymology

the wish names it so: *the learner term hook returns as an opt-in toggle*. a toggle is a control
with two positions that one act flips; the term hook has exactly two, on and off.

rejected:
- **switch** — the nearer english, but `route.guard.brain.switch` already holds it for the guard's
  brain change. one word, one concept
- **flag** — reads as a cli argument (`--flag`); the toggle is durable state in a file, not an
  input to one run
- **opt-in** — names the default (off until asked), never the control a caller turns

## .boundary

the toggle is per repo and per hook. the author tag `toggle=learn.terms.hook/role=learner` carries
the boundary into the settings file itself, so a reader of the entry knows which control wrote it.

## .evidence

- the declared operation `setTermsHookToggle` and its outcome union `TermsHookToggleOutcome`
- the author tag on the one entry `enable` writes
- invariant: the toggle's state is the presence of its entry; no second store (a flag file, a
  `.meter` record) holds it, so the file a session reads and the state `get` reports cannot disagree
