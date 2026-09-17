# S19 · absorb the feedback ⟺ absorb each concern within it — one verb, one law

- **kind** = a coinage + a required invariant + a deep refactor (A and B both ruled)
- **said** = 2026-09-15, over the verb for the dispute|concede decision and the `contemplate` gate

## .said — verbatim

on the verb, across several turns:

> also, lets discuss a better term than 'stanced' for the verb of decision of dispute|concede ;

> well whats the purpose. the purpose is to respond to concerns reviewers enumerated. so it need to
> check each concern off ?

> setConcernAbsorbed ?

> maybe "Absorbed" is what we want here?
> we absorb the concern as a dispute or a concession

> right. we absorbed it into a fulcrum that was disputed explicitly

on the `contemplate` gate:

> and maybe we should rename `contemplated` -> `absorbed` too; i.e., absorb the feedback is only
> allowed once you absorb each concern within it

on the mandate:

> lets mandate that too
> make that an invariant
> enbrief that for the driver role too

on scope:

> rename EVERYTHING

> A and B

> deep refactor ahbode ; reframe the vision and fix the implementation

## .settled

**one verb — `absorb` — at two grains, and the coarse grain is DEFINED by the fine one.**

| grain | the act | the artifact |
|---|---|---|
| a **concern** | absorb one concern — render its disposition, `disputed` or `conceded`, with its argument | a stance row (+ a fulcrum, for a dispute) |
| the **feedback** | absorb a reviewer's whole given — every concern within it absorbed | the reviewer is discharged |

**the invariant, required:** a body of peer feedback is absorbed **iff** every concern it enumerates
is absorbed. there is no coherent state *"feedback absorbed, a concern un-absorbed"* — that is
feedback ignored under cover of a response.

## .the two rulings — A and B, both taken

- **A** — the verb rename: `setStoneAsStanced` → `setStoneAsAbsorbed` at the concern grain. `stance` the
  noun stays (the disposition absorbed: disputed | conceded).
- **B** — a **COMPOSITION**: `contemplated` renamed to `absorbed` PLUS one added gate. the per-reviewer
  `.taken` STAYS — it is what *absorb the feedback* names. what is new: **the `.taken` is refused until
  each concern within it is absorbed** — *"absorb the feedback is only allowed once you absorb each
  concern within it."* absorb-the-feedback is composed of absorb-each-concern.

⚠️ **B is a RENAME + an ADDED gate, never a teardown.** the wisher corrected this framing outright:
*"its not a teardown. its an ADDITIONAL gate before the `.taken` file will even be accepted"* and
*"its a rename and added gate: before you can absorb the feedback, you must absorb each concern."*

| the piece | what it is |
|---|---|
| the rename | `contemplated` → `absorbed`. the `.taken` (feedback-grain act) stays |
| the added gate | the `.taken` is not accepted while any concern of that given stands un-absorbed |
| the composition | `feedbackAbsorbed(given) ⟺ ∀ concern : absorbed(concern)` — the whole gated on its parts |

⇒ **not one act is retired.** a disputed concern still carries its argument in its fulcrum; the
`.taken` still records the reviewer-grain engagement. the driver drives through BOTH — absorb each
concern, THEN the `.taken` is accepted. the wisher ruled it in-scope: *"A and B"*, *"rename
EVERYTHING"*, *"deep refactor … reframe the vision and fix the implementation"*.

## .the sequence the wisher set

> propagate the briefs and rules first. THEN propagate this rename in THIS PR.

⇒ vision + fulcrum + seed + the invariant + the role briefs land **first**; the code change (verb
rename, the added `.taken` precondition gate, snapshots) follows in the same PR.

## .why "absorb" — the harm test the term survived

`rule.require.enumerate-before-you-name`: the verb must cover **both** members and exclude the
neighbours.

| candidate | covers dispute? | covers concede? | neutral across both? |
|---|---|---|---|
| `addressed` / `settled` | ✅ | ✅ | ❌ leans *agreed* — reads as concede, lies about a dispute |
| `absorb` | ✅ take it in, shed it as a dispute | ✅ take it in, commit to fix as a concession | ✅ names the **intake**, never the agreement |

⇒ *"we absorbed it into a fulcrum that was disputed explicitly"* is the tell: a **disputed** concern
is still **absorbed** — into a fulcrum. `absorb` names *take up and render a disposition*, which is
true of both members and false of none.

## .landed

- the term dispute `stanced → absorb` opens in
  `.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.review.absorption._.choice.reason.md`.
- the invariant: `define.invariant.review.peer.absorb` — sourced at
  `src/domain.roles/driver/briefs/`, published to `.agent/repo=bhrain/role=driver/briefs/`, so a
  driver boot holds it.
- the driver rule: `src/domain.roles/driver/briefs/rule.always.absorb-every-concern.md`.
- the vision § *the terms* records A + B, the merged gate, and the `.taken`/fulcrum dedup.
