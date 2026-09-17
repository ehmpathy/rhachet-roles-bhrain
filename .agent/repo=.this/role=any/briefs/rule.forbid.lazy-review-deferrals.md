# rule.forbid.lazy-review-deferrals

> **a review concern is never set aside because it is "not important right now". it has exactly THREE
> sanctioned outcomes — fix it now, dispute it as wrong, or (only when the fix is clearly, massively
> dirty) split it to an independent PR. every other deferral is forbidden.**

deferrals are unacceptable in **99%** of cases. the 1% is a fix so dirty it must be its own PR — and
even that owes a dream, a fulcrum, and a dispute that cite it. **there is no door labelled *"valid,
clean, but not now."***

## .the three doors, and the wall

| outcome | when it applies | the driver runs | what it costs |
|---|---|---|---|
| **fix now** — the default (99%) | the concern is valid and the fix fits this PR | `--as conceded --with <r> --about <c>`, then repair, then re-arrive | one round |
| **dispute — it is WRONG** | the concern is not a defect at all | `--as disputed … --why <fulcrum>` | a `.taken` + a fulcrum the council rules on |
| **followup — it is MASSIVELY DIRTY** | the fix is a real defect, but it ripples far past this PR — a cross-file rename, a contract change, a migration | catch a dream, raise a fulcrum, then `--as disputed … --why <that fulcrum>` | an independent PR + a council read |
| 🔴 **"later, it's minor"** | — | — | 🔴 **FORBIDDEN.** the door this rule welds shut |

⇒ a concern that is **valid and clean is fixed THIS round.** full stop. the only reason a valid
concern leaves this PR unfixed is that its fix is too dirty to fit — and that is a followup, not a
"later."

## .why

- a deferral-because-unimportant is **invisible debt**: no owner, no ticket, no return date. *"minor"*
  is the word under which a real lesson is quietly dropped.
- reviews encode production lessons (`research.selfreview-effectiveness`). a lesson deferred as
  *"minor"* is a lesson un-learned, and it recurs.
- the queue proves it: measured 2026-08-30, this repo's radio held **41 open / 0 claimed** — every
  item small when it was seen, deferred by someone who could have done it
  (`rule.always.fix-forward-under-scouts-honor`).
- a genuine independent PR is legitimate and **tracked**; a *"later"* that is a spoken intention is a
  deletion in a polite coat (`rule.always.catch-dreams-for-followups`).

## .the bar for a followup — "clearly, massively dirty"

the SAFE/CLEAN test decides it (`rule.always.fix-forward-under-scouts-honor`):

- **SAFE and CLEAN → 🔴 fix NOW.** it is not a followup.
- fails CLEAN **by a wide margin** — the fix ripples across files, opens a contract, forces a
  migration → an independent PR earns its place.
- *"some extra work"*, *"a few more lines"*, *"another function"* is **NOT the bar.** the bar is a fix
  whose blast radius does not fit the PR under review.
- and the followup still owes all three: a **dream** (the work, so it is not lost), a **fulcrum** (the
  decision to defer, so the council can overrule it), and a **dispute** (which drives the road on and
  cites both).

## .the driver's duty

- meet every concern with one of the three doors, **this round**.
- never write *"will address later"*, *"out of scope for now"*, *"minor — skip it"*, and never leave
  a concern silently unanswered.
- if you reach for *"later"*, ask the SAFE/CLEAN question first: clean → **fix it**; dirty → it is a
  followup, and it owes a dream + fulcrum + dispute.

## .the reviewer's duty

- do **not** accept *"later"* / *"in a followup"* / *"minor"* as a settlement of a concern.
- a driver's deferral that is neither a fix, a justified dispute, nor a clearly-massively-dirty
  followup (with its dream + fulcrum) = a **blocker you MUST raise**, and re-raise until it is met by a
  real door.
- grade the followup's dirt honestly: a fix the driver called *"too dirty"* that is in fact SAFE and
  CLEAN is a lazy deferral in a followup's coat — raise it.

## .the test

> **for this concern, which of the three doors did the driver walk — and does the fourth ("later,
> minor") describe what actually happened?**

a real door → honest. the fourth → this defect, whichever coat it wore.

blocker: a review concern deferred as *"not important now"* · a concern left silently unanswered
across a round · a followup claimed for a fix that is SAFE and CLEAN · a followup with no dream, no
fulcrum, or no dispute · a reviewer that accepts *"later"* / *"minor"* as a settlement.
false positive: a concern fixed this round · a justified dispute (the concern is not a defect) · a
genuine massively-dirty followup carried by a dream + fulcrum + dispute.

⇒ see also: `rule.always.converge-with-reviewers` (driver — a review is a conversation, not a verdict)
· `rule.forbid.unanswered-exits-from-a-blocker` (driver — the door taxonomy this sharpens) ·
`rule.always.fix-forward-under-scouts-honor` (driver — the SAFE/CLEAN test) ·
`rule.always.catch-dreams-for-followups` (driver — the dream a followup owes) ·
`rule.forbid.suppression-of-undeclared-concerns` (repo=.this — the peer law on the same
mechanism) · `term=route.guard.review.absorption.dispute._.choice._.md` (the two grounds a dispute stands
on).
