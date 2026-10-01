# domain.term.choice.reason: route.guard.brain.switch

## .etymology

`switch` is taken from its electrical sense: a device that redirects a live circuit **without a
break in the circuit**. that is exactly the property this feature turns on and the property that
decided its architecture.

⇒ the wisher settled it on 2026-09-11, verbatim: *"it preserves the conversation, no worries"*.
a `/model` redirects which engine answers and leaves the session's thread intact.

🔴 **the rejected design was a SPAWN per stone** — `enroll --brain <cli>` at every entry
- it has none of the switch's sharp edges
- it discards the drive's context at every stone
- ⇒ one fact parts the two, and the word names it: a switch preserves the circuit; a respawn breaks it

## .disputes

### dispute: switch — raised 2026-09-08 — status: RESOLVED (itemize it)

- raised.by  = peer reviewer `repo-rules`
- claim      = the words composing `route/brain/` operations are *"English words used in comments
               and type-level prose, not domain-object field names or operation-name verbs"*, so
               `rule.require.domain-term-itemization` does not reach them
- counter    = 🔴 **unsound on its face for `switch`.** `dispatchBrainSwitch` is a declared
               `domain.operation` of this repo, so its verb and nouns fall under the rule's own
               stated test. the refute would hold for a word that appeared only in a comment; this
               word is in an operation name, a module path, and four render operations
- resolution = the refute is withdrawn. re-raised as a blocker and itemized here.
               🟡 a refute that survives one round is not a settled question — it survived
               until a reviewer re-read it against the operation names

### dispute: swap — raised 2026-09-09 — status: RESOLVED (keep `switch`)

- raised.by  = the wish's own prose, *"swap brains per stone"*
- claim      = the wisher's word is `swap`, and `rule.always.archive-the-wishers-words-verbatim`
               says their coinage is its etymology
- counter    = the wisher's word is the **layfolk** word, and `howto.domain-discovery` calls for
               both: *"capture exact words from BOTH the expert … and the layfolk"*. `swap` implies
               a two-way exchange — that the displaced brain goes somewhere and could come back.
               it does not: the prior brain is simply no longer addressed
- resolution = keep `switch` in every contract; `swap` is recorded forbidden. the wish's prose is
               untouched, per the synonym rule's own carve-out that a comment may use an
               alternate perspective

## .evidence

### the act-vs-state seam, measured

`getCloneAddress.integration.test.ts` `[case10]`, 2026-09-17, against the shipped binary:

```
{"serial":"92a88ae2-…","slug":null,"reachState":"LIVE","actorHash":"3fc30308"}
```

🔴 no `brain` field. so rhachet reports a clone's reach, its serial, and its hash — and not
what engine it runs under. that is `F5`'s whole ask, and it is why the two words cannot merge:

- a record that says `switched` claims a state no instrument observed
- a record that says `requested` claims an act, which the dispatch did observe

⇒ **one word per concept, and here the second concept is what the instrument can actually see.**

### the operation names that compose it

| operation | the noun it acts on |
|---|---|
| `dispatchBrainSwitch` | the switch, put on the wire |
| `formatStoneBrainUndispatched` | a switch that was owed and did not go |
| `genBrainDispatchClaim` | a reservation that one switch is in flight |
| `applyStoneBrainOnEntry` | the edge that fires one switch per stone |

⇒ four declared operations, one noun. **that recurrence is itself the signal the rule fires on**
(`rule.forbid.domain-term-inconsistency`: *"the inconsistency is the SIGNAL that a term has earned
its coinage"*).

## .invariants

- a switch is dispatched at most once per stone entry, reserved by a `BrainDispatchClaim`
- a switch's target is resolved before it is dispatched, never a slug assumed
- a switch that was dispatched is not evidence the brain accepted it (`case=3`, wisher-deferred
  2026-09-13)
- an absent `brain:` key dispatches no switch at all, and emits no line (`case=10`)
