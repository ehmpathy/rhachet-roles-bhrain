# F028 · `--severity better|urgent` is a flag on `--as conceded`, default `better`

- **rework** = clean · **confidence** = 80% · **status** = best-guessed

## .the fork

the wisher named the taxonomy and the split (S14): *"maybe we need to split --concede into --concede
urgent vs --concede better."* the wisher named the two words; the CLI SHAPE that carries them is mine.

| option | shape |
|---|---|
| **A** | `--as conceded --severity better\|urgent` — a flag on the extant `conceded` status |
| **B** | two new statuses: `--as conceded-better` / `--as conceded-urgent` |
| **C** | a separate verb: `--as conceded` then `--severity` set by a second command |

## .taken, and why

**option A.**

- **a severity is an ATTRIBUTE of a concede, never a kind of stance.** the stance is `conceded`; the
  severity grades it. B would fork one concept into two statuses, which the glossary would then have
  to reconcile (`rule.forbid.domain-term-ambiguity`) — and every consumer that switches on `status`
  would carry two cases for one stance.
- **A reuses the extant `--about`/`--with` grammar.** `--as conceded --with <reviewer> --about
  <concern> --severity <sev>` reads as English at the call site, and the parser already dispatches on
  `--as`. the severity is one more optional flag beside `--why`, parsed like `--with`.
- **C splits one declaration into two commands** — a concede with no severity, then a severity with
  no concede. the two could drift, and a half-declared concede is a state no consumer should have to
  handle.
- **the default is `better`, deliberately** (S11): the taught norm is concede-and-fix, and a `better`
  concession is the common case. an ungraded concede is a `better` one — the harm test is only owed
  when a driver reaches for `urgent`.

## .rework, and why

**clean.** `--severity` is one optional flag; the ledger gains one optional `severity?` field on the
`level?` precedent; the exhaustion disposition reads it. to fold into B later would be a status
rename plus a consumer sweep — but no caller hardens against the flag, and the default keeps every
extant concede valid.

## .confidence, and why it is 80%

the wisher's taxonomy makes A near-forced — a severity is plainly an attribute, not a stance. the
20% sits in the DEFAULT: whether an ungraded concede should be `better` (taken) or should be
**refused** until graded, the way an ungraded stance is refused. taken `better` because S11 names
concede-and-fix the default and a `better` concession is the common case — but a reviewer who reads
the ungraded concede as a dodge of the harm test may prefer the refusal. recorded rather than
dismissed.

## .where

`1.vision.yield.md` § *the severity split* · `rule.always.concede-with-a-severity` (driver) ·
`philosophy.a-review-budget-balances-perfection-with-pragmatism`

## .the verdict

_not yet ruled._
