# seed S07 — the judge must tally the LATEST review, always

## .said — verbatim

> must be the LATEST always.

said in answer to a handoff that laid out two shapes and asked which. ⚠️ **the answer picked
neither** — it settled the **property** and left the shape open.

## .settled

**a judge grades the newest verdict each reviewer has spoken. never the newest verdict that happens
to sit at the current artifact hash.**

⇒ *"latest"* is a property of the **reviewer**, never of the **hash**. a verdict is superseded by
that reviewer's next word — and by no other event.

### what that forbids outright

| the event | before | under S07 |
|---|---|---|
| the driver edits code the reviewer never read | the verdict leaves the tally | 🔴 **it stays. only the reviewer may retire it** |
| the reviewer is exhausted at the moment of the hash move | the verdict leaves the tally | 🔴 **it stays** |
| the reviewer re-runs and speaks anew | superseded | superseded — **the one route that was already right** |

⚠️ **so the coarse/fine question the handoff asked is downstream of this, never equal to it.** both
shapes satisfy S07; they differ only in how many *stale* verdicts survive. **the invariant is settled
and the implementation is not.**

### why it is the same claim as this whole behavior

the wish's defect **D2** reads: *"contemplation debt is keyed `(slug, hash)`, so any code edit
discharges it."* P2 repaired that for the **debt** — an unanswered blocker now survives an edit.

🔴 **S07 states the identical claim about the COUNT.** an edit is not an answer, and it must not
discharge a verdict any more than it discharges a debt.

⇒ *"an edit is a change of address"* — the vision's own mental model, applied one lane over.

## .the consequence the wisher owns next

a persisted **nitpick** has no driver-side discharge: `…Uncontemplated.ts:9,17` filters on
`blockers > 0`, so the `.taken` route does not reach it. under S07 its only exits are a budget top-up
or a human overrule.

⚠️ **that is a real cost of the settlement, never an argument against it** — recorded so the next
traveler meets it as a known price rather than a surprise.

## .landed

- `review/handoff.v1.to_wisher.the-judge-tallies-one-hash-not-the-latest-review.md` — the handoff this
  answers; its `.the ask` is now settled and its `§6 recommendation` is superseded by this seed
- ⛔ **no code change** — the settlement is recorded, not implemented. it sits behind the wish's
  `.scope` fence (item #1) and is not this behavior's to build
