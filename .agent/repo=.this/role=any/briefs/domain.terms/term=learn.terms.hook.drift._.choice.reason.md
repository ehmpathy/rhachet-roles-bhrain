# domain.term.choice.reason: drift

## .etymology

drift is a slow move away from a declared position. a term hook entry drifts when its file was
written by hand, by a prior version, or twice — it still runs the hook, and no longer matches what
`enable` writes.

rejected:
- **stale** — already the trigger word of the hook itself (*your distillation went stale*). a
  second sense on one surface would read two ways in one tree
- **legacy** — dates the entry. a hand copy pasted today is drift, and not legacy

## .boundary

the boundary `learn.terms.hook` scopes it to the toggle's entries alone. a peer Stop hook of
another role is never drift; the toggle never touches it.

## .evidence

- the `drifted` status and its count in `getOneTermsHookState`, and the leaf `asTermsHookDriftLeaf`
- vision case=5 and its alterpath rows (`on-drift`, `on-rhachet-authored`)
- invariant: after `enable`, drift is zero; after `disable`, no term hook entry stands, drift
  included
