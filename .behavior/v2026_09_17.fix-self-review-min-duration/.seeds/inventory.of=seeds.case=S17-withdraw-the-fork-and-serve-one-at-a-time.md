# seed S17 — withdraw the fork, and serve the reviews one at a time

## .said

> yeah how about we just remove the parallelalism part for now then and force them to go one at a
> time

🟡 surface repair only: `parallelalism` → `parallelism`. the ask is unchanged.

### .the question it answers

it lands as a verdict on a defect the wisher found by a READ OF THE EMIT, not by a test:

> 🍃 the other lanes
>    │
>    ├─ 1 more asked, and every trigger is already minted
>    ├─ so you may fork — one lane per slug, promised in any order
>    │
>    └─ tests-pass
>       └─ .behavior/my-feature/review/self/for.1._.tests-pass.md
>
> how is this going to work **if they cant see the self review prompts on demand?**

## .settled

### 🔴 the fork is WITHDRAWN. the ladder is served one review per ask

the guard hands out ONE self review. the next is reachable only once this one is promised. the
total is still disclosed (`1/2`), so the ladder's length is no surprise; the other **slugs** are not.

### 🔴 the question was the whole argument, and the answer was no

a forked lane needs three things: a **slug**, a **path**, and its **guide**. the roster served the
first two and could not serve the third:

| where the guide could come from | why the lane could not get it |
|---|---|
| the ask emit | renders for the **next-unpromised** slug only |
| a challenge verdict | renders for the slug in hand, and **only on a refusal** |
| the `.guard` file on disk | the route is **sealed** — `route.mutate.guard` blocks the read, deliberately, so a driver cannot game the rubric |
| a read-only retrieval command | 🔴 **there is none.** `src/contract/cli/route.ts` mentions self review three times, all help text |

⇒ so a forked lane's only move was to **promise blind to provoke `challenge:absent` and read its
guide off the refusal** — which `rule.always.bear-every-self-review` forbids outright, and which
burns the attempt the haste cue reads. **an invitation no mechanism can serve is worse than no
invitation**, because the driver who accepts it is punished for accepting.

### the enforcement needs no new refusal branch

the withdrawn roster's own `.why` was the spec: *"with no roster the driver learns slug N+1 only
once slug N is promised, **which is serial by construction**."* ⇒ the route is sealed, so this emit
was the only surface that could name the other slugs. remove it and the contract holds by
construction.

## 🔴 .what the ask exposed — the fork premise held weight at a SECOND call site

the check the withdrawal forced: *what else was true only because a fork was assumed?*

`setStoneAsPassed` minted a trigger for **every** unpromised review at the first `--as passed`.
under a true fork that is correct — every lane really is asked at once. serially it is a defect:

- `.since` **is** the ask, and the haste cue reads elapsed-since-the-ask
- a mint-all stamps review 4's ask at the moment review 1 was asked
- ⇒ by the time the driver meets review 4 its clock reads forty minutes, `elapsed < window` can
  never hold, and **`patience, friend` is dead for every review after the first**

⇒ **the round's headline feature was silently disabled for 3 of every 4 reviews**, by a premise one
call away from the roster that advertised it. the repair is a lazy mint — one trigger, for the
review actually asked for.

🔴 **and it buys the serial contract a TOOTH that was never designed for it.** an out-of-order
promise now finds no ask and meets `challenge:unasked`, which refuses rather than mints. so the
ladder is not merely undiscoverable — it is enforced, by a verdict built for the rewind case.

## 🟡 .the transferable form

**a withdrawn premise does not announce its other call sites.** the roster and the mint were the
same assumption at two grains; only one of them said `fork` in its own `.why`. ⇒ when a capability
is withdrawn, grep for the *claim*, then ask of every survivor: **was this correct, or merely
correct under the premise?**

⚠️ and the defect was found by a human who **read an emit** — not by 5 review rounds, 15 self
reviews, or 1748 green tests. the second one this round (`c8′` was the first). **a rendered surface
is an artifact no test reads for sense.**

## .landed

- `src/domain.operations/route/formatRouteStoneEmit.ts` — the roster call site and its input field
- `src/domain.operations/route/stones/setStoneAsPassed.ts` — the lazy mint
- `src/domain.operations/route/guard/tree/formatSelfReviewRoster.ts` — deleted, with its test + snap
- `src/domain.operations/route/guard/review/self/asOtherUnpromisedReviewSlugs.ts` — deleted, with its test
- `src/domain.operations/route/formatRouteStoneEmit.test.ts` — `[case-serial]`, the negative clamp
- `blackbox/driver.route.self-review.acceptance.test.ts` — `[case15]`, re-framed, `[t3]` + `[t4]` new
- `src/domain.roles/driver/briefs/howto.run-self-reviews.[guide].md` + `.min` — the serial contract
- `.behavior/…/1.vision.experience.case=8…md` — retired
- `.behavior/…/1.vision.experience.case=_.md` — the `D7` row, re-verdicted
- `.behavior/…/1.vision.yield.md` — the deliverable rows, the goals table, a new awkward item
