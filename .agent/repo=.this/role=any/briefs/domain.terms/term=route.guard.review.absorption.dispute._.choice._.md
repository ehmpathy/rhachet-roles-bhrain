# domain.term: dispute

term.chosen   = dispute
term.kind     = noun · verb          # noun | verb | adj — reused across objects & operations
term.boundary = review.absorption
term.synonyms.forbidden:
- reject
- override        # ⛔ an override is a HUMAN lever (`overrule`); a dispute is a driver's
- veto
- refute          # ⛔ `[REFUTE]` is a `.taken` shape — prose to the REVIEWER, not the judge
- appeal
- waive

## .what

**one of the two absorptions: the driver argues that ONE named concern should not hold the stone.**

```
rhx route.stone.set --stone <stone> --as disputed --with <reviewer> --about nitpick.4 --why <path>
```

it does two separate jobs, and each carries weight:

- **the arithmetic** — that one concern leaves the judge's tally. the stone may then pass
- **the record** — the `--why` path names a fulcrum entry, which is a **guaranteed later review**
  (`S05`). the argument outlives the round

🔴 **it does not silence the reviewer.** the lane returns next generation (`S03` → fork C), so the
loop remains the correction mechanism. a dispute buys one generation, never the stone.

## 🔴 .the two grounds — and ONLY these two

a dispute stands on **exactly one** of two grounds. no third ground exists:

1. **it is WRONG** — the concern is not a defect. the `--why` fulcrum argues why the reviewer is
   mistaken, out of scope, or has flagged a deliberate tradeoff.
2. **it is MASSIVELY DIRTY** — the concern is a real defect, but its fix ripples so far past this PR
   (a cross-file rename, a contract change, a migration) that it belongs in an independent PR. the
   `--why` fulcrum carries the deferral decision **and** cites the caught dream that holds the work.

🔴 **a dispute is NEVER *"valid, clean, but not important right now."*** a concern that is valid and
whose fix is SAFE and CLEAN is fixed **this round** — that is a `concede`, not a dispute. a deferral
because a fix is *minor* or *later* is forbidden outright (`rule.forbid.lazy-review-deferrals`).

## .the invariants

1. it targets **exactly one** concern; it sheds **exactly one** from the tally
2. `--why` is **required**, and it is a **path** to a fulcrum entry the driver authored — never prose
   (`S05` → `F018`)
3. one fulcrum entry may back **N** disputes
4. no gate reads the entry's content (`S04` — *"a reason is a nudge to reconsider"*). the beneficiary
   is the author, and a gate cannot improve a mechanism whose action completes before any reader
   arrives
5. it discharges **only** the concern it names — every un-named concern still gates
   (`rule.forbid.suppression-of-undeclared-concerns`)

## .refs

- `.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/1.vision.yield.md`
- `src/domain.operations/route/guard/review/getNonOverruledReviewFiles.ts` — the extant seam a
  dispute's exclusion is modelled on ⚠️ **at a coarser grain than a dispute may use** — see `.reason`

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.absorption.dispute._.choice.reason.md` — etymology, why `refute` and
  `override` are forbidden, and the grain that a forgive's seam would have imported
