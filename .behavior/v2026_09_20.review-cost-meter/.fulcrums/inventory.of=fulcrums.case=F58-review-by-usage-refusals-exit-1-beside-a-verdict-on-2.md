# fulcrum F58 — `review.by`'s usage refusals exit 1, because its 2 is already a verdict

- rework = 🔴 **dirty** — `review.by`'s exit contract, which role wrappers in other repos branch on
- status = 🟡 **BEST-GUESSED 2026-09-27 — option A, keep exit 1**
- confidence = 🟡 **75%**
- raised.by = peer lane `mech-failhides`, nitpick.1, round i012 hash `1d2e7ad1acf30d30a0`

## .the fork

`rule.require.exit-code-semantics` maps a caller-fixable error to exit 2. `review.by` spent its 2
on a VERDICT before this branch: `exit 2` means *"a rubric found blockers"*. its three usage
refusals (`--role` absent, a flag with no value, an unknown flag) and its terminal
`BadRequestError` catch all exit 1, beside a header that now reads `✋ ConstraintError:`.

| option | what it does | cost |
|---|---|---|
| **A — keep exit 1** (taken) | the header names the class; the code stays where the extant contract put it | the word and the code disagree on one skill |
| B — move usage to exit 2 | matches the rule's table | 🔴 a wrapper that reads 2 as *"blockers found"* reports a malformed call as a review verdict — a false red on a gate |
| C — a third code (e.g. 64, `EX_USAGE`) | parts all three states | 🔴 a new published code; every wrapper that branches on `review.by`'s exit must learn it, in repos this wish never named |

## .why A, at the time

- B turns a usage error into a fake verdict, which is worse than the mismatch it cures: the
  rule's own purpose is that a caller can tell *what happened* from the code
- C is the right end state and a contract change on a skill other roles wrap
  (`howto.add-review-by-to-a-role`), so it belongs to the skill's owner, not a cost-meter branch
- the header already tells a human reader they must act, and names the fix; the code's only
  reader is a machine caller, and every extant caller reads `1` as *"not a clean verdict"*, which
  holds

## 🟡 .why 75%, not higher

- a council may judge C cheap enough to land now, if no wrapper in the org branches on `1`
  specifically — that census was not taken
- the severity is `better` on the harm test: no shipped harm has a name, since every caller
  already treats 1 as not-clean

## .the precedent, weighed 2026-10-05

the header rule names this shape and sanctions it. `rule.require.qualified-error-headers` carries a
PreToolUse exception where the glyph moves and the exit code does not: a claude-code hook reads
exit 2 as *"blocked"*, so a malfunction there still exits 2 and wears `💥 MalfunctionError:`. the
rule calls that disagreement deliberate, and forbids a reader to "correct" the code.

`review.by` is the mirror case. its exit 2 is reserved by its consumers for *"blockers found"*, so a
constraint keeps the `✋ ConstraintError:` header for the human and the non-verdict code for the
machine. the header says who must act; the code says what kind of result this was. both claims hold.

## .where

- `src/contract/cli/review.by.ts` — the three usage refusals, and the terminal
  `BadRequestError` catch
