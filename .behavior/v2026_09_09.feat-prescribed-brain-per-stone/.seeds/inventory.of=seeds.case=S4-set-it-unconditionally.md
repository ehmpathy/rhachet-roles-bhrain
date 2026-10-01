# S4 — set it unconditionally

## .said

> we can just set the model even if we're already on that model though. why do we care what model we
> are at if we know we can just enforce the model desired at every stone boundary? i.e., when you
> pass|arrive into a new stone, we can just set the model

## .settled

**a guard declares an END STATE, so the applier CONVERGES to it rather than diffs against a believed
current one.**

⇒ the design question *"what brain is live right now?"* carried no load at all. it was a question the
compare needed, and the compare was what stood under review.

🔴 **and the sharper half: a compare-based applier is BLIND to out-of-band drift by construction.**

| the applier | a value changed outside its knowledge |
|---|---|
| compare-then-set | **never corrected.** its belief says the state matches, so it skips — and it skips at every later boundary too |
| converge | ✅ **corrected at the next boundary**, with no detection at all |

⇒ **the optimization is not free of correctness risk; it IS the correctness risk.** a convergent
applier holds no belief, so it cannot hold a stale one.

🟡 **the general form:** where an operation declares a desired end state and its re-run is benign,
the compare in front of it is no optimization with a small cost — it is a **second source of truth**
about a state the operation already owns.

## 🟡 .what it does NOT settle

it says naught about whether the re-run is benign. *"it is idempotent"* is a claim about the **end
state** and never about the **path** — an operation can converge to the same state and spend a real
cost on the way. ⇒ that gap is closed by `S5`.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F14-the-applier-converges-rather-than-compares.md`
- `1.vision.experience.case=6.the-brain-is-already-right.md`
- `1.vision.yield.md`
