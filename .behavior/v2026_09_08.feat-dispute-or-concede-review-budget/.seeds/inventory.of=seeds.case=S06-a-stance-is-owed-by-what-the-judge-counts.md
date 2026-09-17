# S06 · a stance is owed by whatever the JUDGE COUNTS

- **caught** = 2026-09-10 · **kind** = 🔴 **a correction** — the driver had narrowed the stance to
  blocker-driven rejections; the wisher restated the mechanism and the narrow clause fell out

## .said

> nah, they only need to dispute if they want that review excluded from the judges counts, right?

## .settled

🔴 **a dispute's mechanism is a TALLY EXCLUSION.** it does not lift a hold by fiat, and it does not
suppress a review. it drops that lane's review file from the set the judge sums.

```ts
const { totalBlockers, totalNitpicks } = await computeReviewTotalsFromFiles({
  reviewFiles: reviewFilesToCount,          // an ALREADY-FILTERED set
});
```

⇒ **so the predicate for "is a stance owed?" is not a judgment at all.** it is: *does this lane's
review file carry counts that hold the road?* the judge compares **both** axes to their allowances,
so **a nitpick-only rejection owes a stance exactly as a blocker-driven one does.**

## 🔴 .the durable kernel — key a declaration gate on what the CONSUMER reads

> **when a gate asks an actor to declare a position, key its predicate on what the DOWNSTREAM
> CONSUMER actually reads — never on a proxy that seems to mean the same.**

the proxy here was *"blockers > 0"*, and it seemed to mean *"the review holds the road"*. it does not:
a judge with a raised nitpick allowance holds the road on nitpicks alone, and a judge with the default
allowance holds it on **one**.

| the predicate | what it is |
|---|---|
| *"which critiques DESERVE a formal answer?"* | a judgment, and one a designer will get wrong |
| 🔴 *"which critiques does the JUDGE COUNT?"* | a read of the consumer, and it needs no judgment |

⇒ the first question invites a designer to draw a line. **the second has no line to draw** — it is
whatever the downstream operation sums, and that is checkable.

## 🔴 .the driver's forgive, at lane grain — the seam this reuses

the exclusion is not a new mechanism. a **human**'s overrule already does the identical work, one
grain coarser:

> *"keeps only the review files whose level was NOT overruled by a human … a level the human
> overruled is forgiven — **its blockers must not gate passage**"*

| | the **forgive** | the **dispute** |
|---|---|---|
| who declares it | a **human** | the **driver** |
| its grain | a **level** | a **lane** |
| what it does to the tally | drops those files | 🔴 **the same** |

⇒ **the extant operation's own `.why` is this design's argument, in the engine's words.** a design
whose mechanism already exists one grain away is a design that was discovered rather than invented.

## ✅ .and it is the plainest read of the boundary

*"do not remove the peer review. the reviewer still runs and still renders a verdict … never whether
one happens."*

under a tally exclusion the review **runs**, its file is **written**, its verdict is **rendered**, and
the artifact **persists** for whoever reads it later. **only the COUNT is dropped.** ⇒ the boundary is
honored literally rather than argued around.

## 🔴 .what it cost the design to have guessed the other way

the narrow fork was best-guessed at 85%, and its cost was not a smaller feature — it was **a second
predicate beside the first**, plus a hole where the second one did not reach:

| | the narrow fork | the wisher's read |
|---|---|---|
| predicates | **two** — a verdict-keyed one, plus a *"blockers only"* clause | 🔴 **one** |
| a nitpick-only lane over its allowance | **held, with no lever at all** — no debt, no budget spend, no remedy line | dispute or concede |
| the halt's refusal message | had to **apologize for its own refusal** | never fires there |

⚠️ **the apology was the tell, and it was read as a message defect rather than a coordinate defect.**
a refusal that must explain away its own reasonableness is evidence the case was **placed** wrong,
never that the explanation was thin.

## 🔴 .the deeper cause — a walk cannot witness a call it was derived from

the dimensional walk agreed with the narrow fork at every cell, and that agreement was read as
independent evidence for it. **it was not.** the walk's debt axis had been defined on a raw blocker
count — the narrow fork's own predicate — so it could not have disagreed.

⇒ **a walk can only check a call it was not derived from.** where a coordinate system is defined in
terms of a fork, the walk is a restatement of the fork and must be labelled one.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F015-which-rejections-owe-a-stance.md`
- `.fulcrums/inventory.of=fulcrums.case=F012-the-stance-predicate-keys-on-the-verdict.md`
- `.fulcrums/inventory.of=fulcrums._.md`
- `1.vision.experience.dimensions.md`
- `1.vision.experience.case=_.md`
- `1.vision.experience.case=10.the-nitpick-only-rejection.md`
- `1.vision.yield.md`
