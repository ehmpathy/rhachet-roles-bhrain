# S10 — effort is a subaxis of brain, and the shorthand is the choice

**source** = the wisher, 2026-09-25 · **settles** = the `brain:` declaration contract, verbatim

## .said

the exchange opened with a question about the surface:

> hey is this able to control the /effort per brain too?

> and can we do that via one brainslug or not

> well, look it up dude. does claude support `/model` and `/effort` declared in one command? or do we
> need to support each

> and lets support the declaration of each right now, seems important ; i.e., we may need to say both
> if both are specified. the brain choice and brain effort

a flat peer-key shape was drafted and rejected. the correction came in seven consecutive utterances:

> nah, brain: { choice, effort }

> effort is a subaxis of brain

> not a peer

> so, folks should be able to specify in the guard file `brain: opus[1m]` or `brain: \n choice:
> opus[1m] \n effort: medium`

> default brain declaration is the choice

> if they want effort, they must explode it

> and if they want to change effort but not choice, then they still explode it but omti the choice

> knawmean/

## .settled

> **a brain carries TWO axes, and `effort` is a sub-axis OF the choice rather than a peer key beside
> it. the scalar form is the shorthand for the choice; an effort is reachable only by an explode.**

three declaration forms, and the parse of each:

| the guard text | `choice` | `effort` |
|---|---|---|
| `brain: opus[1m]` | `opus[1m]` | `null` |
| `brain:` + `choice: opus[1m]` + `effort: medium` | `opus[1m]` | `medium` |
| `brain:` + `effort: medium`, choice omitted | **`null`** | `medium` |

### 🔴 the third row is the one that carries a cost, and the wisher named it on purpose

*"if they want to change effort but not choice, then they still explode it but omti the choice"* is
not an edge case the design tolerated — it is a form the wisher **specified**.

⇒ so `choice` is **nullable past a declared key**, and that nullability propagates: through the
outcome union, through the dispatch fan-out, through every render surface, and through the
attribution record. a shape that made `choice` required would have refused the form the wisher asked
for.

🟡 and it is the form a stone reaches for when it wants to **re-price the same brain** rather than
swap it. the driver keeps whatever brain it already runs, and only the level moves — which is the
cheapest possible prescription, and would have been inexpressible under a required `choice`.

### 🔴 the hierarchy is a claim about the DOMAIN, not about the file format

*"effort is a subaxis of brain / not a peer"* rejects a flat `brain:` + `effort:` pair that would
have parsed with less code and read with fewer levels.

the reason it is right: **an effort level is model-scoped.** `xhigh` is offered by some brains and
refused by others, so a level is a property **of** a brain rather than a second knob beside one. a
flat pair would state, on the page, that the two are independent — and they are not.

⇒ the format carries the hierarchy rather than flattens it away, which is
`rule.require.domain-driven-design` at the grain of a config file.

### 🟡 why it is not a SUFFIX on the choice either

the obvious compression is one fused value — `opus[1m]:medium`, or a second bracket. it is refused
by the transport: `/model` and `/effort` are **two slash commands**, and neither takes the other's
argument. a fused value would have to be split at dispatch, where no guard author is present to see
it split wrong.

🟡 `[1m]` inside a choice is **not** a precedent for that. it is a context-window variant, and it
belongs to the `/model` argument whole — the brain-cli parses it, never this repo.

### 🔴 the shorthand's unambiguity is BOUGHT by the explode requirement

*"default brain declaration is the choice"* + *"if they want effort, they must explode it"* are one
verdict, not two. the second is what makes the first safe:

| if an effort were reachable from the scalar | because it is not |
|---|---|
| `brain: medium` would be ambiguous — a choice, or a level? | `brain: <x>` can only ever mean a choice |
| a parser would need a vocabulary of known levels to disambiguate | ⇒ the parser needs **no vocabulary at all**, and stays a passthrough |

⇒ the explode requirement is what keeps the value a **verbatim passthrough** (the `F10` verdict). a
shorthand that could carry either axis would have forced this repo to know the brain-cli's level
names — the second source of truth `F10` exists to refuse.

## .landed

- `src/domain.objects/Driver/RouteStoneGuard.ts` — `RouteStoneGuardBrain { choice, effort }`
- `src/domain.operations/route/guard/asBrainSubKey.ts`
- `src/domain.operations/route/guard/isGuardKeyExploded.ts`
- `src/domain.operations/route/guard/parseStoneGuard.ts`
- `src/domain.operations/route/brain/isStoneBrainDeclared.ts`
- `src/domain.operations/route/brain/dispatchBrainSwitch.ts`
- `src/domain.operations/route/guard/parseStoneGuard.brain.integration.test.ts`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.brain._.choice._.md`
- `.fulcrums/inventory.of=fulcrums.case=F29-two-says-race-for-order.md`
