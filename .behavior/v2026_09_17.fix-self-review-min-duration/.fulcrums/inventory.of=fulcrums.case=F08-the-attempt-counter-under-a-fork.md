# fulcrum F08 — the attempt counter under a fork 🌙 MOOT

**rework** clean · **status** 🌙 **MOOT — the fork is withdrawn** · **confidence** 75% · **where**
`setSelfReviewTriggeredReport.ts`

> 🔴 **this fulcrum's whole subject was a RACE BETWEEN LANES, and `S17` left no second lane.** the
> guard hands out one self review per ask; a driver cannot fork. ⇒ read `.the verdict` at the foot,
> then the body only if the fork is ever re-proposed.

## .the fork, stated fairly

`setSelfReviewTriggeredReport` increments the attempt count with a **read-modify-write**: read
`.since`, parse `attempts: N`, write `N+1`, then restore the mtime.

under `D7 = parallel` that is no longer single-writer. two observations, and they point opposite
ways:

- **across slugs it is safe.** the report is keyed per slug, so lane 3 and lane 5 touch different
  files. the fork's common case never collides
- **within one slug it is not.** a lane that retries while a peer lane promises the same slug can
  interleave a read and a write, and an increment is lost

| | **leave it** | **make it atomic** — write-then-rename, or a lock |
|---|---|---|
| the lost increment | possible, rare | impossible |
| what a lost increment costs | the liveness hatch opens on the 4th attempt rather than the 3rd | — |
| complexity | naught | a lock, and a lock has its own failure modes on a shared `.route/` |

## .taken, and why at the time

**leave it, and assert the property**, at 75%.

the worst outcome of a lost increment is that a hatch opens one attempt late. that is a **delay**,
never a wrong verdict and never a hard stop — and it is bounded, because the lanes that race are by
construction the lanes that retry one slug.

⚠️ **the reason it is a fulcrum at all:** the argument above is a claim about the worst case, and
nobody has enumerated the interleavings. a 75% confidence on *"the worst case is a late hatch"* is
exactly the kind of call `rule.always.itemize-the-fulcrums-you-best-guess` exists to surface.

⇒ and the cheap half is owed regardless: **`case=8 [t3]`'s assertion** — a promise is idempotent and
burns no attempt — is a real test, and it is what makes a lost increment merely late rather than
silently wrong.

## 🔴 .the safety net above does NOT exist yet — found at `r4`

`[t3]` was cited as a test to write. **it is a behavior change**, and the distinction moves this
fulcrum's cost materially.

`getSelfReviewChallengeDecision.ts:95-100`:

```ts
const { attempts } = await setSelfReviewTriggeredReport(input);   // increments, unconditionally
if (attempts >= plowthroughThreshold) return { decision: 'allowed' };
```

the increment fires on **every** promise attempt that finds the file, before any decision. so a
redundant promise burns an attempt today, and the hatch at `:98` clears the gate on the third.

🔴 **under a fork that is a BYPASS, not a late hatch.** M lanes that each promise one shared slug
reach 3 attempts in seconds — the gate opens with no clock consulted, no path re-verdicted, and no
lane aware it happened. the worst case this fulcrum reasoned about (*"a hatch that opens on the 4th
attempt instead of the 3rd"*) is the **wrong** worst case.

⇒ **the 75% verdict below should be re-read against that.** the drive leaves the verdict as it
stands rather than a quiet re-verdict, because the correction changes the **cost** of leave-it, and a
cost change is the council's to weigh. what the drive asserts now is narrower: **`[t3]` is a
precondition of the parallel deliverable, never an optional test beside it.**

## .the rework

**clean.** an atomic write is a local change inside one operation, behind an unchanged signature.

## 🌙 .the verdict — MOOT, on both of its terms independently

the question was *"is a lost increment acceptable under a fork?"* **both nouns in that sentence are
gone**, and each one alone would have sufficed:

| the term | what retired it |
|---|---|
| **the fork** | `S17` — one review per ask. no second lane, so no read-modify-write race on one slug |
| **the hatch** | `S11`/`S13` — the liveness hatch is retired with the clock. `attempts` no longer clears any gate, so a lost increment discharges naught |

⇒ **the counter survives and the gate that read it does not.** `attempts` now feeds the haste cue's
`firstAdjudication` test alone, and that test is an **exclusive create** — it asks whether the report
was minted by this call, never what number it holds.

### 🔴 .what stayed live, re-homed

the `r4` correction in the body above — *"the increment fires on every promise attempt, before any
decision"* — is a **real** property of the code and was never about the fork. its consequence is
narrower now and still worth the test: a redundant promise must not retire the haste cue for a review
the driver has not read.

⇒ that clause is pinned at `driver.route.self-review [case16]`, which is kept for exactly this
reason. 🟡 its `.note` names the live causes: a hand-run retry, a re-issued command, a re-drive.
**not a fork.**

### .the transferable form

🟡 **a fulcrum can moot by two routes at once, and the second one is easy to miss.** this drive would
have closed it on `S17` alone and filed the hatch argument as still-live archaeology — but the hatch
had already gone six seeds earlier, in a withdrawal about a different subject. ⇒ **when a fulcrum
moots, re-read every term in its question, not merely the one the latest utterance touched.**
