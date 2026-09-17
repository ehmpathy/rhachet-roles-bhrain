# F23 · `--as rewound --grain peer|self|both` — in scope, or a dream?

- **rework** = clean · **confidence** = ✅ **settled** · **status** = **ruled — the wisher bounded it**
- **raised 2026-09-10**, by the wisher's own proposal and their own answer to it, minutes apart

## .why a fulcrum, when the wisher already answered

`rule.always.fix-forward-under-scouts-honor` is explicit: a deferral for **DIRT** owes a dream **and**
a fulcrum, because *"a dirt call is a judgment about ripple cost, and a judgment made alone is what a
fulcrum list exists to surface."*

⇒ **the wisher supplied the SHAPE of the bound; the dirt grade is mine.** if the ripple estimate below
is wrong, the deferral was wrong, and this row is where a council reads that.

## .the fork

| fork | | |
|---|---|---|
| **A** | build `--grain` in this route | the wisher's second message proposes it |
| ✅ **B** | **teach `--as rewound` now; dream the `--grain`** | ✅ **RULED** — the wisher's fourth message |
| **C** | neither — leave the rewind unmentioned in the driver briefs | 🔴 never on the table; the lever has no other teacher |

## .taken, and why — B

**the wisher's words, verbatim:**

> *"or should that be separate and we just teach --as rewound, and the dream for --grain
> peer|self|both can be later"*

and the two questions return **no** twice:

| | verdict | the evidence |
|---|---|---|
| **SAFE?** | 🔴 **no** | `setStoneAsRewound.ts` carries **no human gate** — no approval check, no TTY guard. every route in every repo reaches it, and it is the operation a stuck driver reaches for |
| **CLEAN?** | 🔴 **no** | `delStoneGuardArtifacts` is a five-glob sweep with a pinned suite; the flag ripples into `rewindAffectedStones`, the cli union, the emit's cascade block, and 🔴 `resetRouteStoneGuardReviewPeerMeters`, a **peer** operation a `--grain self` must not call. ⚠️ **this row once cited a fifth ripple — the self ladder's "trigger state" — and that claim was read on 2026-09-11 and found OVERSTATED.** the ladder's gate is a set-difference over hashless promise files, so that half is a filter. see § *confidence* |

🔴 **and it crosses the host wish's own boundary.** `0.wish.md`: *"do not touch the SELF-review
ladder."* the grain flag's entire purpose is to change what a rewind does to that ladder, so **A is
not a scope stretch — it is the one clause the wish forbids by name.**

## 🔴 .what B still owes, and it is not free

⚠️ **B is not *"defer the whole subject."*** the teach lands this round, and it must name the
**cost** the grain would have removed:

| the brief must say | why |
|---|---|
| `--as rewound` voids every peer verdict on the stone **and its cascade** | that is the driver's reason to reach for it |
| 🔴 it **also re-arms every self review** | else the driver meets the second half as a surprise, mid-refactor |
| the self re-bear has **no waiver** | `rule.always.bear-every-self-review` — *"there is no lever to grant it"* |

⇒ **a priced lever, over an absent one.** that is what makes the deferral honest: the driver is not
denied the move, only told what it costs.

🟡 **and the price is what makes the dream urgent rather than idle.** a lever priced above its
alternatives is a lever nobody takes — the driver reaches for a dispute they do not hold, or
re-arrives on prose they know is stale, because both are cheaper.

## .rework, and why — clean

no state is stored, no contract moves, and no artifact on disk encodes the deferral. to build
`--grain` later is an additive optional parameter defaulted to today's behaviour (`both`), so **A is
reachable at any time at the same cost.** ⇒ the deferral buys time and forecloses naught.

## .confidence — settled

the fork was named, proposed, and bounded **by the wisher, in their own words**, inside one minute.
the only judgment left to me is the **dirt grade**, and it rests on two checkable claims:

1. `setStoneAsRewound.ts` has no human gate — ✅ **read, confirmed**
2. `delStoneGuardArtifacts` sweeps self and peer in one pass with no scope parameter — ✅ **read,
   confirmed** (`:24-51`, five globs, `{ stone, route }`)

3. 🔴 **the third claim — that a kept promise changes whether the ladder re-fires — was an
   INFERENCE, and it is now read.** ✅ **confirmed as to the fact, and it cuts against my own dirt
   grade.** `setStoneAsPassed.ts:207-214`:

   ```ts
   const promises = await getStonePromises({ stone: stoneMatched, route: input.route });
   const promisedSlugs = new Set(promises.map((p) => p.slug));
   const unpromised = selfReviews.filter((r) => !promisedSlugs.has(r.slug));
   ```

   ⇒ the ladder's gate is a **pure set-difference** between the guard's declared `review.self` slugs
   and the `$stone.guard.promise.$slug.md` files on disk. `getStonePromises` stamps every one
   `hash: 'hashless'`, and its own note says why — *"firm checkpoints that don't invalidate"*.

| | what I asserted | ✅ what the read shows |
|---|---|---|
| the **fact** | a kept promise keeps the ladder satisfied | **true.** the slug stays in `promisedSlugs`, so it drops out of `unpromised` |
| the **mechanism** | 🔴 *"the self ladder's trigger state"* — cited as evidence of a **state-machine** change | 🔴 **overstated.** there is no trigger state to reconcile. it is one `Set.has` over a glob |

🔴 **so `--grain self` is a FILTER on that half — the cheaper shape — and my CLEAN row argued the
dearer one.** the `.triggered` files `getSelfReviewChallengeDecision` reads govern the 30-second
timer and the plowthrough count: they gate **when** a promise is admitted, never **whether the review
is owed**. a rewind that spared the promises would leave the ladder satisfied, full stop.

⚠️ **CLEAN still returns no, on the ripples this claim never carried:** `rewindAffectedStones`, the
cli union, the emit's cascade block, and 🔴 `resetRouteStoneGuardReviewPeerMeters`, which a
`--grain self` must **not** call. **SAFE is untouched** — a shipped, un-gated operation every route
reaches, whose deletion set the flag changes.

✅ **and the verdict never rested on the dirt grade.** B was ruled by the **wisher**, in the message
that proposed A. ⇒ **this correction moves the argument and not the outcome**, which is the one
condition under which an author can be trusted to record a result that weakens their own case — so
a council should weigh it on its evidence rather than on my candour.

## .where

`src/domain.operations/route/stones/delStoneGuardArtifacts.ts:24-51` — the five-glob sweep ·
`setStoneAsRewound.ts:15-26` — the signature, and the absent human gate ·
`rewindAffectedStones.ts` — the cascade caller ·
`resetRouteStoneGuardReviewPeerMeters.ts` — 🔴 a **peer** operation a `--grain self` must not call ·
`.dream/v2026_09_10.feat.a-rewind-has-no-grain.md` — the deferred work, with the shape of the fix ·
`S10` — the wisher's four messages, verbatim.

## .what would settle it

✅ **settled 2026-09-11, by the read this section asked for.** it read: *"does the self-review guard
re-fire when a `.guard.promise.*.md` file survives?"* — **no, it does not.** the gate is
`setStoneAsPassed.ts:214`, a set-difference over hashless promise files, and the § *confidence* table
carries the verdict.

⚠️ **and the answer went the way this section predicted would flip CLEAN.** it did not flip: the
claim was one of four ripples, and the other three stand. ⇒ **the section had staked the whole CLEAN
row on one sub-claim**, which over-weighted the cheapest question in the set.

🟡 **what remains open is narrower than what this section asked**, and it belongs to the dream rather
than to this row: whether `--grain peer` must also spare `$stone.blocked.triggered`, the fifth glob,
whose grain is **neither** self nor peer.

## .the verdict once ruled

✅ **B — ruled by the wisher, 2026-09-10, in the message that proposed A.**

⇒ the row stays on the board because the **dirt grade** is a driver judgment the council may reverse,
and because `rule.always.fix-forward-under-scouts-honor` requires the judgment be visible rather than
buried in a dream's *"why it is not done in this round"*.
