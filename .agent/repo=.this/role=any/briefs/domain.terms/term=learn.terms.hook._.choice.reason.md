# domain.term.choice.reason: hook

## .etymology

claude code names the mechanism a hook: a command its settings bind to an event (`hooks.Stop`).
the word is the host's own, so the contract adopts it as is.

rejected:
- **nudge** — the nudge is the text the hook prints. one hook prints a nudge at a stale stop and
  naught at a fresh one, so to call the entry a nudge fuses the mechanism with one of its outputs
- **reminder** — `route.reminder` is the driver's own mechanism, a daemon note; a second sense
  would overload it

## .boundary

`hook` alone is generic: rhachet syncs many role hooks, and claude code holds others. the boundary
`learn.terms` names this one — the term-distill hook of the learner — and the cli surface
`learn.terms.hook` spells the same path.

## .evidence

- the declared entry (`TERMS_HOOK_DECLARED`) and its fragment test (`isTermsHookCommand`), with no
  rival word in either
- the vision's contract, `rhx learn.terms.hook enable | disable | get`
- invariant: a repo holds the hook only after its toggle is turned on; the learner role itself
  declares none (vision case=8)
