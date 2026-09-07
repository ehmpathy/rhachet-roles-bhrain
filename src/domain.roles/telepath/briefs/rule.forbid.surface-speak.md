# rule.forbid.surface-speak

> **do not speak in the terms a concept happens to wear. speak in the terms it rests on.**

the clamp on `rule.require.distillation`. that rule names the drill; this names the smell.

**surface-speak** = prose pitched at the layer the author first met the concept on — the adjective,
the symptom, the mechanism, the label — where the root beneath it was reachable and was not reached.

## .the lead smell — the adjective that stands for a mechanism

> *"this approach is robust and scalable"* · *"a clean separation"* · *"an elegant fix"*

**not one rule in the density family fires on these.** `require.brevity` and `forbid.rambles`
cut surplus words, and every word above is individually defensible. the sentence still asserts
naught a reader can check.

⇒ **the adjective is a receipt for a mechanism the author did not name.** `robust` stood for a
retry, an idempotent write, a bound. **write that.**

## .the shapes

| shape | 👎 the surface | 👍 the root |
|---|---|---|
| the adjective | *"robust and scalable"* | *"idempotent, so a retry converges"* |
| the what-happened | *"four reviewers overflowed"* | *"four reviewers rendered no verdict, and an unreviewed reviewer reads identical to a clean one"* |
| the mechanism echo — you report what was asked for, never why | *"added a `--verbose` flag"* | *"the default swallowed the stderr line on a non-zero exit. that is fixed"* |
| the symptom as cause | *"the test is flaky"* | *"the upstream refuses, then hangs. a retry is a coin flip on someone else's weather"* |
| the label | *"it is a race condition"* | *"two writers, one key, no lock — the second read precedes the first write"* |
| the paraphrase | the surface restated in different surface words | the layer beneath both |

## .the test

> **ask *"why?"* until the answer stops to shift. that answer is what you write.**

⇒ the drill's floor, and the condense check that proves it finished, are declared by
`rule.require.distillation`. this rule is its clamp, so it fires on what the drill did not reach.

| when… | then… |
|---|---|
| you reach for robust · clean · scalable · elegant · simple | the strongest cue. name the mechanism it stood for |
| you name what happened and stop | a reader gains a fact and no way to price it |
| you report the mechanism an actor asked for | drill to the motive. the deliverable may change |
| you write *"it is a $label"* | a label is a pointer to a mechanism. write the mechanism |
| the second sentence restates the first in other words | both sit at the same layer. neither is the root |
| you bulletize a concept you never drilled | a tree of surfaces — correct shape, wrong nodes |
| the subject is a mechanism — a filename rule, an exit code | the surface IS the fundamental. state it flat |

## .what a miss costs, given that the repair is a new claim

`rule.require.distillation` declares why the drill's repair is a new claim rather than an edit,
and why that parts it from every other rule in the canon. the consequence belongs here:

**the cost of a miss is not a rougher read — it is a reader who acts on the surface.** they retry
a degraded upstream, tighten a timeout, or ship a flag where the defect was the default.

## 🟡 .the boundary — a mechanism is not always a surface

| a violation | not a violation |
|---|---|
| an adjective offered in place of the mechanism it stood for | an adjective beside a stated mechanism |
| a symptom reported as a cause | a symptom stated as a symptom, cause unknown and said so |
| the mechanism echoed where the motive was reachable | a literal the reader must type — the set is `define.distillation`'s |
| a paraphrase at the same layer | a measurement — a number is already the floor |

**the line that parts them: is the layer beneath this one REACHABLE, and did you reach it?**
unreachable, and said so → honest. reachable, and skipped → surface-speak.

## .the axis

a **structure** rule, so telepath owns it (`rule.require.generic-governs-structure-never-voice`). a
surface claim is a surface claim in every register, so it prescribes no member of that rule's voice
row.

## .enforcement

blocker: an adjective offered in place of the mechanism it stood for · a claim stated at its surface
where a root was reachable · a mechanism reported as the request, with no drill to the motive · a
symptom reported as a cause.
nitpick: a paraphrase that restates the surface at the same layer.
false positive: the exemption set is `rule.require.distillation`'s and is declared there — a clamp
does not fork its act's exemptions.

## .see also

- `rule.require.distillation` — the positive peer: decompose, then condense
- `define.distillation` — the whys, the demos, and the method
- `rule.forbid.subversive-prose` — the neighbour smell: a sentence a reader cannot dispute
- `howto.domain-discovery` (architect, foreign) — the five-whys drill, at the scale of a domain term
