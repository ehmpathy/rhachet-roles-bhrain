# rule.always.weigh-a-read-by-what-it-rules-out

> **a read confirms a claim only as far as it rules out the rival claims. before you count a read as support, name the rival, and ask whether the read would have looked the same under it. if yes, the read carries no weight.**

**how it applies the basis:** a read that agrees with your claim feels like proof, and you trust the feel. the read is weighed against the claim you did not hold, not the one you did.

## .what

a read consistent with every live claim tells you none about which one holds; only a read that would differ between them moves the claim.

| the read | under your claim | under the rival | weight |
|---|---|---|---|
| the build passes after the fix | passes | the fix was a no-op and the flake did not recur → passes | none: run a test that fails without the fix |
| the error line names a timeout | yes | a dropped connection also logs a timeout | none on cause; read the socket log |
| the reverted fix turns the test red | red | green, if the test never touched the defect | high: this read rules the rival out |

## .the move

| step | the act |
|---|---|
| 1 | name the claim, and at least one rival that fits what you know (Sagan: spin more than one hypothesis) |
| 2 | for each read, ask: would it differ under the rival? |
| 3 | count only the reads that differ |
| 4 | seek the read that would disprove your claim, not the one that would agree (Heuer) |

## .the test

> **name the rival claim. would this read have looked any different under it?**

no → the read carries no weight. find one that would.

## .the bound

the method this rests on (Heuer's analysis of rival hypotheses, ACH) has little measured evidence that it reduces bias, so this rule stays a brief and a review cue.

## .enforcement

blocker: a claim reported as confirmed, which a peer acted on, on reads that would look the same under a named rival
nitpick: a diagnosis that names no rival claim

cites: `define.skeptic.lessons-from-the-greats` (Heuer; Sagan 1995).

peer: `rule.always.trust-no-one-especially-not-yourself` (the foundation) · `rule.always.weigh-each-claim-with-one-burden` (the same weight, whichever way it points)

forbid twin: `rule.forbid.confirmations-that-rule-out-no-rival`

---

written by human + beaver 🦫