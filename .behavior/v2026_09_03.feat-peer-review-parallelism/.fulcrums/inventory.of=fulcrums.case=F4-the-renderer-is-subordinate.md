# fulcrum F4 — the renderer is subordinate: floor now, peak only if room

**rework** — clean · **status** — 🔴 **SETTLED by the wisher, 2026-09-08** · **confidence** — n/a

## 🔴 .the settlement — the fork dissolved rather than was chosen

the wisher stated three constraints (seed **S2**), and the third made the fork moot:

> *"only the last line is updatable"* · *"we require the spinner to say how long all has been
> inflight"* · *"we want to know how many are left too"*

⇒ **the peak, as this fulcrum defined it, was never available.** a per-lane spinner needs several
mutable lines; `\r` gives exactly one. so *"commit to the full live renderer"* was not an expensive
option — it was **an impossible one**, and this fulcrum had priced it rather than checked it.

**what replaced it:** one **aggregate tail status line** — the group's elapsed, the inflight count,
the count left — always last, with settled blocks appended above it. built on the extant
`overwrite`/`seal` pair, **no cursor-up, no frame buffer**.

| the old framing | what holds now |
|---|---|
| floor = append-only, **no live feedback** | floor = append-only **with** a live aggregate status line |
| peak = per-lane spinners, needs `\x1b[{n}A` | 🔴 **unbuildable on `\r`. struck** |
| the render is *subordinate* — it may be skipped | 🔴 **live status is committed**, because it costs a single `overwrite` call |

⇒ **the fulcrum's 9% doubt was aimed at the wrong seam.** it worried whether the floor must cover
non-tty; the real uncertainty was whether the peak could exist at all, and it could not.

⚠️ **what stays optional is only cosmetic** — colour, unicode polish, frame rate. that is not a
fulcrum; it is a preference, and it needs no council verdict.

⇒ **so this fulcrum is closed by settlement, not by judgment**, and the sections below are kept
verbatim as the record of the call as it stood. `rule.always.itemize-the-fulcrums-you-best-guess`
wants the verdict recorded, never the reasoning rewritten.

---

## _the record as it stood — superseded above_

**rework** — clean · **status** — open · **confidence** — 91%

## .the fork, stated fairly

the wish declares the live multi-lane renderer **desired, never required**, and warns it *"is most
likely to eat the whole round."* so the call is not *whether* to build it — it is **what the vision
commits to**.

| option | for | against |
|---|---|---|
| commit to the full live renderer | the wish wants it; a concurrent run with a one-lane spinner is a genuinely worse display than today's | it is the piece most likely to consume the round, and the wish explicitly forbids that trade |
| commit to no render change | smallest scope | 🔴 **the extant `\r` single-line overwrite is not merely dull under concurrency — it is WRONG.** it would animate one lane and hide three. to leave it untouched is a regression, not a neutral choice |
| **commit to a floor, aim at a peak** ✅ | delivers a display that is correct under concurrency at near-zero cost, and leaves the beautiful version as an explicit stretch | two targets means a reviewer must grade against the floor, not the peak, and that distinction can be lost |

## .taken, and why at the time

**a floor, with the peak explicitly optional.**

- **the floor**: emit each lane's in-flight line once at group start, append each settle line as it
  lands, never overwrite. append-only output is correct under any concurrency and needs no cursor
  math. this is exactly what the wish sanctions — *"a plain sequential render of results as they
  settle"*.
- **the peak**: multi-line cursor-up redraw with a per-lane spinner and elapsed clock. shipped only
  if the round has room.

🔴 **the middle option is the trap, and it is the one that reads as "safe".** "change no render
code" sounds like the conservative choice and it is not: the extant renderer's correctness depends
on exactly one lane in flight. remove that premise and the render actively misinforms. so *some*
render work is mandatory, and the floor is the minimum that is honest.

## .why the confidence is 91%

the wish is unusually explicit here, so the call is close to dictated rather than judged. the 9%
is where the floor's boundary sits — in particular whether the floor must also handle the
**non-tty** case identically (case 8, `[case2]`). i claimed it must, because CI is not a tty and
the blackbox suite runs there; that part is my inference, not the wish's instruction.

## .rework — clean

the floor is a change in how progress events are emitted, not in what they carry. the peak is
purely additive on top of it and can land in a later round without a rewrite of the floor.

## .where

- `1.vision.experience.case=8.the-onlooker-sees-several-in-flight.md`
- `src/domain.operations/route/guard/tree/formatGuardTree.ts`
- `genContextCliEmit` — the `\r` overwrite

## .the verdict

🔴 **SETTLED 2026-09-08 by the wisher** — see `.the settlement` at the head of this file. the peak
was struck as unbuildable; live status moved into the floor. **no council verdict is owed.**

⇒ seed: `.seeds/inventory.of=seeds.case=S2-only-the-last-line-is-updatable.md`
