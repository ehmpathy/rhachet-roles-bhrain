# domain.term.choice.reason: route.guard.brain

## .etymology

`brain` is **adopted, never coined.** this repo is `rhachet-roles-bhrain`; its role briefs speak of
*"the brain"* throughout (`brain.atom`, `brain.repl`, `context.brain.repl.imagine`), and
`rhx review` already takes a `--brain` flag. the guard key takes the word the repo already uses.

⇒ `rule.always.reuse-pavement-before-improvise`: the word was on the ground before this feature.

## .the rejected peers

| candidate | why not |
|---|---|
| `model` | the **near-miss**, and the strongest candidate. rejected: see below — it is an alias, and it warns |
| `engine` | names the mechanism, never the domain concept. this repo has no `engine` anywhere |
| `llm` | an implementation class, and an acronym — `rule.forbid.shouts` bars the shouted form, and the lowercase form still names a technology rather than a role |
| `agent` | already overloaded: `.agent/` is the brief directory, and an agent is a whole actor where a brain is what one actor thinks with |

## 🔴 .why `model` is an ALIAS and not the chosen word

`model` is what the surface says — `/model` is the slash command, `--model` is the flag on every
archived enroll line — so a hand reaches for it first. it was still rejected, for two reasons:

1. the repo's own word is `brain`. `rule.forbid.domain-term-inconsistency` forbids one concept
   named two ways. `--brain` on `rhx review` and `brain:` on a guard are then one word, one concept,
   across both spend axes.
2. `model` is overloaded outside this repo — a model is a schema, a trained artifact, a domain
   model. `brain` carries exactly one sense here.

⇒ but the near-miss is REAL and will recur, so the parser recognizes `model:` and warns by
name — it names `brain:` outright rather than a guess. the key set is permissive by decree (an
unknown key cannot throw), which makes that warn the only signal a near-miss would ever get.

🔴 **and the value is DROPPED, never carried onto `brain`.** the recognition buys a better warn, not
an accepted key:

- `rule.forbid.domain-term-synonyms` forbids a contract that accepts a synonym at all — it
  permits the synonym to be *recorded* as forbidden, which is what `term.synonyms.forbidden` does
- a `model:` that still works is a `model:` nobody ever renames, so an accepted alias would
  permanently establish the second key the rule exists to prevent
- ⇒ `case=4` `[t4]` states it directly — *"parseStoneGuard drops the line, exactly as it does
  today"* — and `[t6]` carries the value only after the driver edits the key

🟡 the residue is the one `F4` already priced: a driver who does not read output runs the stone on
its inherited brain. that is the same trade the near-miss warn makes, and `case=4`'s grade table
states it as a caveat rather than smooths it.

## 🔴 .why the VALUE is a passthrough, not a rhachet brainslug

the field could have taken a rhachet brainslug and mapped it. it does not:

- the consumer is `clone say @:<address> --what '/model <value>'`
- `/model` is the brain-cli's command, and its argument vocabulary is the brain-cli's
- ⇒ a map would be a second source of truth about a vocabulary this repo does not own, and it would
  drift the day the brain-cli adds a name

so the declared contract is: **the value is passed through unchanged.** a reader of a guard sees
exactly what the clone will receive, and a new brain name works the day the cli accepts it, with no
release here.

🟡 the cost is real and accepted: a typo in the value is not caught at parse. it lands as a failed
`/model` inside the clone, and that failure is silent by decree (`F5` / `S6`) — the clone keeps the
brain it had, which is the pre-feature behavior.

## 🔴 .why `effort` is a SUB-AXIS, and why the shorthand is the choice

a flat `brain:` + `effort:` pair was drafted, and the wisher struck it in three words: *"effort is a
subaxis of brain / not a peer"*.

**the argument is about the domain, never the file format.** an effort level is model-scoped —
`xhigh` is offered by some brains and refused by others — so a level is a property of a brain
rather than a second knob beside one. a flat pair would state on the page that the two are
independent, and they are not.

| candidate shape | why not |
|---|---|
| a peer key — `brain:` + `effort:` | 🔴 **struck.** it asserts an independence the domain does not have |
| a fused value — `opus[1m]:medium` | refused by the transport: `/model` and `/effort` are two slash commands, and neither takes the other's argument. the split would happen at dispatch, where no guard author sees it go wrong |
| a nested object, explode-only | rejected: it forces every guard that wants a brain and no effort into three lines |
| **a scalar shorthand + an explode** | ✅ taken. the common case is one line; the explode is what an effort costs |

### 🔴 the explode requirement is what keeps the value a PASSTHROUGH

*"default brain declaration is the choice"* and *"if they want effort, they must explode it"* are one
settlement, not two — the second is what makes the first safe.

- were an effort reachable from the scalar, `brain: medium` would be ambiguous
- ⇒ a parser would then need a vocabulary of known level names to disambiguate it
- ⇒ which is exactly the second source of truth about the brain-cli's vocabulary that the
  passthrough decision above exists to refuse

so the explode is not ceremony. **it is what lets `brain: <x>` carry one sense while this repo knows
not a single brain-cli level name.**

### 🟡 a choice may be OMITTED past a declared key, and that was specified

*"and if they want to change effort but not choice, then they still explode it but omti the choice"*
— so `choice` is nullable past a declared `brain:`, and a stone may **re-price the brain it already
runs** with no choice declared at all.

⇒ the cost is that `string | null` propagates through the outcome union, the dispatch, every render
surface, and the attribution record. it is paid knowingly: a required `choice` would have made the
cheapest prescription in the format inexpressible.

⇒ archived verbatim at
`$route/.seeds/inventory.of=seeds.case=S10-effort-is-a-subaxis-of-brain.md`.

## .the boundary — why `route.guard`, not `route.stone`

the question `rule.require.boundary-qualified-terms` asks is *"$word, of WHAT?"* and the answer is
one word: **guard**.

- a guard bounds what a stone may spend; `budget` and each peer review's `--brain` already live
  there, and this is the third spend key
- a `.stone` is prose with no schema at all, so it could not host a key even if the concept fit
- ⇒ but the MOTIVE decides it, never the mechanism. to lead with *"a stone has no schema"* prices
  the guard as a convenient host and invites *"and once a stone grows a schema?"*

⇒ the wisher settled this verbatim: *"its on the guard file because the guards guard the budget
spent on each stone; in addition to the schema"* — archived at
`$route/.seeds/inventory.of=seeds.case=S7-hard-stones-are-front-loaded.md`.

## .evidence

- **the vision** — `.behavior/v2026_09_09.feat-prescribed-brain-per-stone/1.vision.yield.md`
- **the seed** — `…/.seeds/inventory.of=seeds.case=S1-the-seed-issue-377.md` (the archived issue)
- **the guard-vs-stone settlement** — `…/.seeds/inventory.of=seeds.case=S7-hard-stones-are-front-loaded.md`
- **the two-axis settlement** — `…/.seeds/inventory.of=seeds.case=S10-effort-is-a-subaxis-of-brain.md`
  (the sub-axis verdict, the three declaration forms, and the omitted choice)
- **the fulcrums** — `…/.fulcrums/inventory.of=fulcrums._.md`; F2 settles the `model:` alias, F11 the
  absent glyph, F12 the driver-only scope, F14 the convergent applier
- **the parse cases** — `src/domain.operations/route/guard/parseStoneGuard.brain.integration.test.ts`
  covers the bare key, the quoted value, the alias warn, the unknown key, and a nested `--brain`;
  `[case9]`–`[case14]` walk each declaration form and its boundary — the shorthand, the exploded
  pair, the effort alone, the empty block, the spelling folds, and the refused values
- **the real guard** — `src/domain.operations/route/brain/setStoneBrain.integration.test.ts` parses
  this route's own `5.3.verification.guard`, which declares `brain: claude-sonnet-5[1m]`

## .disputes

none raised. the `model:` near-miss was settled at authorship as an alias rather than as a dispute,
because no traveler argued for it — the parser anticipates the hand, it does not answer a claim.
