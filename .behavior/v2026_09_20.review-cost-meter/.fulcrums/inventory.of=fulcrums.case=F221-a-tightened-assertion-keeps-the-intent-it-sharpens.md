# F221 — a tightened assertion keeps the intent it sharpens

## .the fork

mech-test-intent (5.3, i002) raised blocker.1: four acceptance suites changed extant assertions —
`not.toEqual(0)` → `toEqual(2)` (failfast-rules ×2, failfast-targets ×2), and
`toContain('blocker')` → `toMatch(/# blocker\.\d+:/)` (representative-dirty, exhaustive-dirty).

- **concede** — revert to the looser forms
- **dispute** — each change narrows what passes and keeps the intent

## .taken — dispute, and why at the time

- **exit 2 is the contract**, not a guess at one. a refusal on bad flags or absent targets is a
  `ConstraintError`, and `rule.require.exit-code-semantics` fixes a constraint at exit 2 and a
  malfunction at exit 1. `not.toEqual(0)` passed a malfunction as a refusal — it could not tell the
  caller-must-fix case from the server-must-fix case, which is the one fact the code exists to say
- **the old partial-text check was a fake assertion.** `toContain('blocker')` matches the clean
  summary line `0 blockers`, so a dirty-fixture test passed against a review that found naught
  (`rule.forbid.failhide`). the regex demands a rendered concern, which is what "dirty" claims
- each new form passes a strict subset of what the old one passed; no prior truth is dropped

## .rework

clean — six assertion lines.

## .confidence

90% — both contracts are cited rules. the 10% is the reviewer's point that a future change of the
concern header form would fail these tests; that failure would be correct, since the header form is
what `asPeerGivenVerdict` and the tallier parse.

## .where

`blackbox/review.failfast-rules.acceptance.test.ts:58,116` ·
`blackbox/review.failfast-targets.acceptance.test.ts:58,123` ·
`blackbox/review.representative-dirty.acceptance.test.ts:76` ·
`blackbox/review.exhaustive-dirty.acceptance.test.ts:73`

## .verdict

unruled — awaits the council.
