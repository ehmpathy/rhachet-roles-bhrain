# domain.term.choice.reason: route.guard.brain.effort

## .etymology

`effort` is **adopted, never coined.** it is the brain-cli's own word — `/effort` is the slash
command, and its own status line reads *"Effort level: auto (currently high)"*. the guard sub-key
takes the word the surface already says.

⇒ `rule.always.reuse-pavement-before-improvise`: the word was on the ground before this feature, and
— unlike `model` — it collides with no word this repo already owns.

## .the rejected peers

| candidate | why not |
|---|---|
| `reasoning` | a gerund — `rule.forbid.gerunds`. it also names a mechanism where `effort` names the dial a human turns |
| `thinking` | same gerund bar, and it asserts a claim about what the brain does internally |
| `depth` | a metaphor, and an ambiguous one: depth of what — a search, a recursion, a context? |
| `budget` | 🔴 the dangerous one. `budget` is already a declared guard key with one sense — how many review rounds a reviewer may spend. `rule.forbid.domain-term-ambiguity` bars one word over two concepts |

## 🔴 .why `effort` and `brain` do NOT collide, though both name spend

a reviewer could fairly ask why two spend words sit in one file. they name **different quantities**,
and each has exactly one sense:

| key | quantity |
|---|---|
| `budget` | how many rounds a reviewer may spend |
| `brain` (`choice`) | which engine the driver's turns run on |
| `brain.effort` | how hard that engine works per turn |

⇒ three spend axes, three words, no overload. that the third is nested under the second is the whole
sub-axis argument — a level has no sense apart from a brain.

## 🔴 .why it is a SUB-AXIS and not a peer key

a flat `brain:` + `effort:` pair was drafted and struck. the reason is a fact about the domain rather
than about the file format:

> **an effort level is model-scoped.** `xhigh` is offered by some brains and refused by others.

a flat pair asserts on the page that the two are independent, and they are not. a guard that declared
`effort: xhigh` beside a brain that refuses it would read as well-formed and dispatch a command that
the clone rejects — the exact class of silent failure this feature's whole design fights.

⇒ the format carries the hierarchy rather than flattens it away.

🟡 **a suffix on the choice — `opus[1m]:medium` — is refused by the transport**
- `/model` and `/effort` are two slash commands; neither takes the other's argument
- a fused value would be split at dispatch, where no guard author sees it split wrong
- `[1m]` is no precedent — the brain-cli parses it as part of the `/model` argument

## 🔴 .why the VALUE is a passthrough, and why the EXPLODE is what protects it

the same argument the parent term makes for `choice` holds here, and the explode requirement is what
keeps it available:

- were an effort reachable from the scalar form, `brain: medium` would be ambiguous
- ⇒ the parser would need a vocabulary of known level names to tell a choice from a level
- ⇒ which is precisely the second source of truth about a vocabulary this repo does not own

so *"if they want effort, they must explode it"* is not ceremony. **it is what lets both axes stay
verbatim passthroughs.**

🟡 the cost is the one the parent already priced: a typo in the value is not caught at parse. it
lands as a failed `/effort` inside the clone, and that failure is silent by decree (`F5` / `S6`) —
the clone keeps the level it had.

## .the boundary — why `route.guard.brain`, not `route.guard`

the question `rule.require.boundary-qualified-terms` asks is *"$word, of WHAT?"* and the answer is
one word: **brain**.

- an effort has no sense apart from a brain — it is a level some brain runs at
- a `route.guard.effort` would be the flat peer key the wisher struck, spelled as a term
- ⇒ the ancestry in the filename is the sub-axis argument, made checkable

## .evidence

- **the settlement** — `…/.seeds/inventory.of=seeds.case=S10-effort-is-a-subaxis-of-brain.md`, the
  wisher's seven consecutive corrections, verbatim
- **the parent term** — `term=route.guard.brain._.choice._.md` and its `.reason`, which carry the
  three declaration forms and the passthrough contract
- **the two-says race** — `.fulcrums/inventory.of=fulcrums.case=F29-two-says-race-for-order.md`
- **the inheritance, at parity with the choice** —
  `.fulcrums/inventory.of=fulcrums.case=F30-an-inherited-effort-is-unrecorded.md` and
  `.seeds/inventory.of=seeds.case=S12-effort-parity-with-choice.md`
- **the parse cases** — `src/domain.operations/route/guard/parseStoneGuard.brain.integration.test.ts`
  `[case10]` the exploded pair, `[case11]` the effort alone, `[case13]` the lenient forms,
  `[case14]` a refused value dropped per-axis rather than per-block
- **the wire** — `src/domain.operations/route/brain/dispatchBrainSwitch.integration.test.ts` records
  each say's `--what` and asserts no say carries both commands

## .disputes

none raised. `budget` was rejected at authorship as an overload rather than as a dispute, because no
traveler argued for it — the ambiguity bar settles it before a claim is made.
