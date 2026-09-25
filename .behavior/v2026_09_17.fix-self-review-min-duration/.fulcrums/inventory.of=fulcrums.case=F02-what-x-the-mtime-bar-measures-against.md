# fulcrum F02 — what `X` the mtime bar measures against

**rework** clean · **status** ✅ **RESOLVED — the TRIGGER's mtime** (`S14`) · **confidence** 97%
**where** a new check in `getSelfReviewChallengeDecision`, after the path check

## ✅ .what was ruled

> *"yeah, from trigger"* (`S14`)

**the freshness bar reads `articulation.mtime > trigger.since.mtime`** — *"you wrote this after you
were asked."* the drive's guess, confirmed, and the ambiguity the drive flagged at 80% was the
drive's own to carry rather than a real fork in the wisher's intent.

⇒ **the artifact-mtime candidate is refused**, and the reason is worth a line beyond *"it was not
picked"*: it would have restored **this round's own defect on a new axis**. a repair advances the
artifact's mtime past the articulation, so the honest review is graded stale and must be re-touched
per edit. **that is the hash key with a timestamp in place of a hash.**

🟡 **the transferable rule** (`S14`): *measure freshness against the **ask**, never against the
**subject**.* an artifact under review moves because the review works — so a bar that measures a
review against what it reviews penalizes the review for its own success. **the ask is the one event
the driver's diligence cannot advance.**

## .the fork, stated fairly

`S01` clause 3: *"and have an mtime greater than X."* `X` is never named, and the two candidates
behave **oppositely** on the case this wish exists for.

| `X` | the driver who repairs 9 times |
|---|---|
| **the trigger's `.since` mtime** — "written after you were asked" | writes the articulation once, passes. `.since` is pinned at the ask and never moves |
| **the artifact's own mtime** — "newer than what it reviews" | 🔴 **every repair invalidates the articulation.** they must re-touch it after each edit — the wish's own defect, in a new coat |

a third candidate exists and is weaker: **a wall-clock duration**, which is the timer under a second
name and would double-charge the same friction.

## .taken, and why at the time

**the trigger's `.since` mtime**, at 80%.

it is the only candidate that preserves `D6`'s degeneracy, which is the invariant the whole round
rests on. the artifact-mtime candidate is *more intuitive* — *"your review should be newer than
what it reviews"* reads as obviously right — and that is exactly why it earns a fulcrum rather than
a silent call.

⚠️ **the reason confidence is 80% and not higher**: the utterance is one clause long and the drive
picks its referent. a wisher who meant the artifact would read this as the drive's error, not their
own ambiguity.

## .the rework

**clean.** one comparison, one operand. to swap the operand is a one-line change plus a re-take of
`case=6`'s snapshot.

## .the verdict

✅ **ruled: the trigger's `.since` mtime** (`S14`).

⇒ the question was: **does a repair to the artifact invalidate an articulation already written about
it?** the answer is **no**.

## 🔴 .and the answer is only as good as `F10`'s build — they must ship together

the bar reads `trigger.since.mtime`, so **whatever invalidates the trigger sets what this bar
measures against.** that makes this verdict conditional on work that is ruled but not yet built:

| if the trigger… | what this bar does |
|---|---|
| is removed by the rewind (`S10`, `F10` ruled) | ✅ compares each articulation against **this round's** ask |
| is never invalidated | 🔴 **compares every future articulation against a frozen instant** — the bar passes always, and the gate loses a tooth in silence |

⚠️ **`F10` is ruled and the code does not do it today.** `delStoneGuardArtifacts`'s glob demands
`.md`; the markers end `.since` / `.uptil`, so the rewind clears the promise and keeps the trigger.
⇒ **this bar is unreachable until that glob is repaired**, and a build that ships the freshness check
without the rewind repair ships a check that cannot fail.

🟡 **so the pair is one deliverable, not two** — and that is why `F10` held first place in the
council order even after it was ruled.
