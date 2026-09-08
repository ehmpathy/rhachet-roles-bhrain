# fulcrum F7 — the `stale` tag keeps its copy, changes its trigger

- **rework** = clean
- **status** = unruled — Q2 in the yield asks the wisher to confirm or overturn
- **confidence** = 🔴 **70%** — was 88%; the reason given for the 88% was **falsified by the shipped
  code** (see below). ⚠️ this block was **absent** until 2026-09-08, which is why the stale 88%
  survived in a `##` title
- **where** = `formatRouteGuardReviewPeerContemplatePrompt.ts` · `getAllRouteGuardReviewPeersUncontemplated.ts`
- **found** = 1.vision; re-scored at `review.self r4` of 5.3

⚠️ 🔴 **the TITLE of this entry is half wrong, and it is left as written.** the trigger did change as
recorded; **the copy did not survive untouched** — three of four lines were rewritten. the title is
kept because the filename is a coordinate that other artifacts cite (`rule.forbid.itemization-without-coordinates`),
and a rename would break those citations to fix a fact this block already states.

## .the fork, stated fairly

P2 breaks the premise the `stale` case rests on. `formatRouteGuardReviewPeerContemplatePrompt.ts:122-124`
declares it: *"a `.taken` exists, but at a prior iteration hash — the artifact changed, so the
critique re-ran and a fresh response is owed."* under the reviewer key, an artifact change no longer
implies the critique re-ran, so a prior-hash `.taken` is frequently the **correct** match.

three ways out:

- **delete the case** — under P2 a prior-hash taken is usually right, so perhaps staleness is no
  longer a concept the driver needs.
- **keep the trigger, rewrite the copy** — accept that it fires on artifact change, and reword it
  to state a truer claim about that.
- **keep the copy, redefine the trigger** — fire on `taken.hash !== latestGiven(slug).hash`.

## .taken, and why at the time

**keep the copy, redefine the trigger.**

| | today | under P2 |
|---|---|---|
| fires when | `taken.hash !== hashCurrent` | `taken.hash !== latestGiven(slug).hash` |
| means | *"the artifact changed since you answered"* | *"the reviewer spoke again since you answered"* |

- **the concept survives P2 intact.** a driver *can* still answer a critique and then have the
  reviewer re-raise a sharper version. that state is real, distinct from `absent`, and worth its own
  render. deletion would lose a true signal.
- 🔴 **the copy is already correct for the new trigger.** *"your response answers a prior generation
  of this critique"* is precisely true when the reviewer has re-raised since — and it misleads only
  under the **old** trigger. so the reword option repairs the wrong half.
- **the one line that does need a touch** is the `why:` beneath it, which today attributes the
  staleness to the artifact change rather than to the reviewer's new given.

⇒ the tag becomes **rarer and sharper**: it fires when a reviewer genuinely spoke again, rather
than every time the driver edited a file.

## .rework, and why

**clean — and cheaper than this entry first recorded.** the predicate swap is not F7's to pay at
all: `getAllRouteGuardReviewPeersUncontemplated:24` must move from `taken.hash === hashCurrent` to
`taken.hash === given.hash` **for P2 to work at all**, or the gate deadlocks. the `stale` tag at
`:31-33` reads whatever that same match decides.

⇒ so F7's marginal cost is **one line of copy** — the `why:` beneath the tag. the new trigger falls
out of a change P2 already compels.

⚠️ **that also removes the one way F7 could have been forgotten.** were it a separate predicate, an
implementer could ship P2 and leave the tag on its old premise. it cannot: there is one match, and
P2 must correct it.

no caller is hardened against what the trigger denotes, and no downstream artifact reads the tag.

## .confidence — 🔴 70%, was 88%

⚠️ **this title read `— 88%` until 2026-09-08, in the very section that records the fall to 70%.**
⇒ **the worst placement the defect can take: a reader who scans titles — which is what titles are
for — takes the falsified number and never reaches the correction eight lines below it.**

the 12% *(as originally reckoned)* is not about the direction — it is about **whether the wisher wants the tag at all** after
P2. a reasonable reader could argue that a rarer `stale` is a case a driver now meets so seldom that
it is a maintenance cost with no payoff, and prefer deletion. that is a taste call about surface
area, and it is theirs.

⚠️ what raised it above a coin flip, **as recorded at the time**, was that the copy needed **no**
edit — a design change whose user-visible words survive untouched is usually one that found the
concept's real boundary rather than one that papered over it.

### 🔴 that argument was FALSIFIED by the implementation — found at `review.self r4` of 5.3

the entry says the marginal cost is *"one line of copy — the `why:` beneath the tag."* the shipped
code rewrote **three of the four** lines. read from source, not the snapshot:

| line | before | after |
|---|---|---|
| `:239` | *"your response answers a prior generation of this critique."* | *"…answers an earlier critique from this reviewer."* |
| `:243-245` | *"the stone artifact changed, so the reviewer re-ran at a new hash…"* | *"the reviewer has spoken again. your prior response still stands…"* |
| `:247` | *"what to do — re-articulate for the current iteration:"* | *"what to do — answer the critique that is live:"* |

⇒ **the title of this entry is now half wrong.** the trigger did change as recorded; the copy did
**not** survive untouched. only the `✋` header line at `:236` is unchanged.

⚠️ **why this matters more than a tidy-up**: this fulcrum is `_unruled_`, and the wisher is asked to
rule on it. its stated reason for 88% confidence is *"the copy needed no edit."* **a verdict reached
on that sentence would rest on a false premise.**

⇒ **the direction still holds and the confidence does not.** the argument for *keep-the-trigger* rested
on the copy's survival, and the copy did not survive — so what actually happened is closer to option
two of the three forks (*"keep the trigger, rewrite the copy"*) than to the option recorded as taken.
**call it 70%**, and let the wisher weigh the fork with the true cost in view: three lines of
user-visible copy, not one.

⚠️ the code's own `.note` at `:222` cites F7 for the `why:` line alone, so the implementer tracked one
of the three. **the other two were reworded without a record until this review.**

## .where

- `1.vision.yield.md` § "Q2, best-guessed — the `stale` trigger, not its copy"
- `formatRouteGuardReviewPeerContemplatePrompt.ts:122-138` — the case and its `.why`
- `getAllRouteGuardReviewPeersUncontemplated.ts:29-34` — the predicate that sets the tag

## .the verdict

_unruled._ Q2 in the yield asks the wisher to confirm or overturn.
